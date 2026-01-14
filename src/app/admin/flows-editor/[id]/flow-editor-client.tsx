'use client';

import { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Node, 
  Edge, 
  addEdge, 
  Connection, 
  Panel,
  useNodesState,
  useEdgesState,
  NodeChange,
  EdgeChange,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { saveFlowNodes, saveFlowEdges, updateFlowContent } from '../actions';
import type { FormNode as FormNodeType, FormEdge as FormEdgeType, NodeType, FormNodeData } from '@/types';
import { ArrowLeft, HelpCircle, Save, Eye, ChevronsUp, ChevronsDown, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nodeTypes } from '@/components/flow-editor/nodes';
import ComponentSidebar from '@/components/flow-editor/ComponentSidebar';
import NodeEditorPanel from '@/components/flow-editor/NodeEditorPanel';
import { toast } from 'sonner';
import { FlowPreviewModal } from '@/components/flow-editor/FlowPreviewModal';
import { ValidationDialog, UnsavedChangesDialog, type ValidationError } from '@/components/flow-editor/ValidationDialog';

interface FlowEditorClientProps {
  flowId: string;
  flowName: string;
  initialNodes: FormNodeType[];
  initialEdges: FormEdgeType[];
  userRole?: string;
}

export default function FlowEditorClient({ 
  flowId, 
  flowName,
  initialNodes, 
  initialEdges,
  userRole 
}: FlowEditorClientProps) {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges as Edge[]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationContext, setValidationContext] = useState<'save' | 'preview'>('save');
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Convert visual flow to markdown/JSON format
  const flowMarkdown = useMemo(() => {
    return convertFlowToMarkdown(nodes, edges);
  }, [nodes, edges]);

  // Validate the flow before saving
  const validateFlow = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Check for empty flow
    if (nodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'Cannot save an empty flow. Add at least a Start node, question nodes, and an End node.',
      });
      return errors;
    }
    
    // Check for start node
    const startNode = nodes.find(node => node.type === 'start');
    if (!startNode) {
      errors.push({
        type: 'error',
        message: 'Flow must have a Start node',
      });
    }

    // Check for at least one end node
    const hasEndNode = nodes.some(node => node.type === 'end' || node.type === 'success');
    if (!hasEndNode) {
      errors.push({
        type: 'error',
        message: 'Flow must have at least one End or Success node',
      });
    }

    // Terminal nodes are only nodes that should end the flow
    const terminalNodeTypes = ['end', 'success'];
    
    // Check each node for proper connections
    nodes.forEach(node => {
      const nodeLabel = (node.data as any).label || node.type;
      const isTerminalNode = terminalNodeTypes.includes(node.type || '');
      const isStartNode = node.type === 'start';
      
      // Check for incoming connections (all nodes except start should have incoming edges)
      if (!isStartNode) {
        const hasIncomingEdge = edges.some(edge => edge.target === node.id);
        if (!hasIncomingEdge) {
          errors.push({
            type: 'error',
            message: `Node is not connected to any previous step`,
            nodeId: node.id,
            nodeLabel,
          });
        }
      }
      
      // Check for outgoing connections (all nodes except terminal nodes should have outgoing edges)
      if (!isTerminalNode) {
        const hasOutgoingEdge = edges.some(edge => edge.source === node.id);
        if (!hasOutgoingEdge) {
          errors.push({
            type: 'error',
            message: `Node has no connections to next steps`,
            nodeId: node.id,
            nodeLabel,
          });
        }
      }
    });

    // Check for reachability - all nodes should be reachable from start
    if (startNode) {
      const reachableNodes = new Set<string>();
      const queue = [startNode.id];
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (reachableNodes.has(currentId)) continue;
        
        reachableNodes.add(currentId);
        
        // Add all nodes this node connects to
        edges.forEach(edge => {
          if (edge.source === currentId && !reachableNodes.has(edge.target)) {
            queue.push(edge.target);
          }
        });
      }
      
      // Check if any nodes are unreachable
      nodes.forEach(node => {
        if (!reachableNodes.has(node.id)) {
          const nodeLabel = (node.data as any).label || node.type;
          errors.push({
            type: 'error',
            message: `Node is unreachable from the Start node`,
            nodeId: node.id,
            nodeLabel,
          });
        }
      });
    }

    // Check for unsupported node types
    const supportedTypes = ['start', 'yes-no', 'text', 'form', 'end', 'success', 'multiple-choice', 'info', 'subflow', 'date'];
    nodes.forEach(node => {
      if (node.type && !supportedTypes.includes(node.type)) {
        const nodeLabel = (node.data as any).label || node.type;
        errors.push({
          type: 'error',
          message: `Unsupported node type "${node.type}". Remove this node and use a different type.`,
          nodeId: node.id,
          nodeLabel,
        });
      }
      
      // Warn about date nodes (they work in editor but not in flow renderer yet)
      if (node.type === 'date') {
        errors.push({
          type: 'warning',
          message: 'Date Picker nodes are not fully supported yet. Please use a Text Input node instead and ask for the date in the question.',
          nodeId: node.id,
          nodeLabel: (node.data as any).label || node.type,
        });
      }
      
      // Warn about form nodes with no fields
      if (node.type === 'form') {
        const formData = node.data as FormNodeData;
        const formFields = formData.formFields || [];
        if (formFields.length === 0) {
          const nodeLabel = formData.label || 'Form';
          errors.push({
            type: 'warning',
            message: 'Form node has no fields. The flow can be saved but will not work properly when users try to fill it out. Add at least one field to make this form functional.',
            nodeId: node.id,
            nodeLabel,
          });
        }
      }
    });

    return errors;
  }, [nodes, edges]);

  // Check if flow is valid (for status indicator)
  const isFlowValid = useMemo(() => {
    const errors = validateFlow();
    return errors.length === 0;
  }, [validateFlow]);

  // Validate and show dialog before saving
  const handleValidateAndSave = useCallback(() => {
    const validationErrors = validateFlow();
    
    // If there are no errors or warnings, save directly
    if (validationErrors.length === 0) {
      handleActualSave();
      return;
    }
    
    // Show validation dialog with errors/warnings
    setValidationContext('save');
    setShowValidationDialog(true);
  }, [validateFlow]);

  // Validate and show dialog before preview
  const handleValidateAndPreview = useCallback(() => {
    const validationErrors = validateFlow();
    
    // If there are no errors or warnings, show preview directly
    if (validationErrors.length === 0) {
      setShowPreview(true);
      return;
    }
    
    // Check if there are only warnings (no errors)
    const hasErrors = validationErrors.some(e => e.type === 'error');
    
    if (!hasErrors) {
      // Only warnings - show preview with a note
      setShowPreview(true);
      return;
    }
    
    // Show validation dialog with errors/warnings
    setValidationContext('preview');
    setShowValidationDialog(true);
  }, [validateFlow]);

  // Actual save function (called after validation passes)
  const handleActualSave = useCallback(async () => {
    setIsSaving(true);
    setShowValidationDialog(false);

    try {
      const nodesResult = await saveFlowNodes(flowId, nodes as FormNodeType[]);
      const edgesResult = await saveFlowEdges(flowId, edges as FormEdgeType[]);
      
      // Also update the flow content with the generated markdown
      await updateFlowContent(flowId, flowMarkdown);

      if (nodesResult.error || edgesResult.error) {
        toast.error('Error saving flow', {
          description: nodesResult.error || edgesResult.error
        });
      } else {
        setHasUnsavedChanges(false);
        toast.success('Flow saved successfully');
      }
    } catch (error) {
      toast.error('Error saving flow', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSaving(false);
    }
  }, [flowId, nodes, edges, flowMarkdown]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      setHasUnsavedChanges(true);
    },
    [setEdges]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      
      // Only mark as unsaved for actual modifications, not internal state changes
      const hasModifications = changes.some(change => 
        change.type === 'add' || 
        change.type === 'remove' || 
        (change.type === 'position' && change.dragging === false) // Only when drag ends
      );
      
      if (hasModifications) {
        setHasUnsavedChanges(true);
      }
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      
      // Only mark as unsaved for actual modifications
      const hasModifications = changes.some(change => 
        change.type === 'add' || 
        change.type === 'remove'
      );
      
      if (hasModifications) {
        setHasUnsavedChanges(true);
      }
    },
    [onEdgesChange]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: FormNodeData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data };
          }
          return node;
        })
      );
      setHasUnsavedChanges(true);
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setHasUnsavedChanges(true);
    },
    [reactFlowInstance, setNodes]
  );

  const handleAddNode = useCallback(
    (type: NodeType) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: 250, y: 100 },
        data: { 
          label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setHasUnsavedChanges(true);
    },
    [setNodes]
  );

  const handleCollapseAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, collapsed: true },
      }))
    );
  }, [setNodes]);

  const handleExpandAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, collapsed: false },
      }))
    );
  }, [setNodes]);

  // Navigate to and select a specific node
  const handleNavigateToNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && reactFlowInstance) {
      // Select the node
      setSelectedNode(node);
      
      // Focus the node on the canvas with smooth animation
      reactFlowInstance.setCenter(node.position.x + 150, node.position.y + 50, {
        zoom: 1.2,
        duration: 500,
      });

      // Flash the node to draw attention (update its data to trigger re-render)
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return { 
              ...n, 
              data: { ...n.data, highlighted: true }
            };
          }
          return n;
        })
      );

      // Remove highlight after animation
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === nodeId) {
              return { 
                ...n, 
                data: { ...n.data, highlighted: false }
              };
            }
            return n;
          })
        );
      }, 1500);
    }
  }, [nodes, reactFlowInstance, setNodes]);

  // Add beforeunload warning for unsaved changes (browser native dialog)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages and show their own
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle navigation with custom dialog
  const handleNavigateAway = useCallback((destination: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(destination);
      setShowUnsavedChangesDialog(true);
    } else {
      router.push(destination);
    }
  }, [hasUnsavedChanges, router]);

  const handleConfirmNavigation = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, router]);

  const handleCancelNavigation = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    setPendingNavigation(null);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Top Navigation */}
      <div className="h-14 bg-card border-b px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigateAway('/admin/flows')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="h-6 w-px bg-border" />
          <span className="text-sm text-muted-foreground">Canvas Editor</span>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold">{flowName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
          
          {/* Validation Status */}
          {nodes.length > 0 && (
            <Badge 
              variant="outline"
              className={
                isFlowValid 
                  ? 'bg-green-500 text-white border-green-600 hover:bg-green-600 dark:bg-green-600 dark:border-green-700 font-medium' 
                  : 'bg-yellow-500 text-gray-900 border-yellow-600 hover:bg-yellow-600 dark:bg-yellow-600 dark:text-gray-900 dark:border-yellow-700 font-medium'
              }
            >
              {isFlowValid ? '✓ Valid' : '⚠ Incomplete'}
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCollapseAll}
            title="Collapse all nodes"
          >
            <ChevronsUp className="h-4 w-4 mr-2" />
            Collapse All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExpandAll}
            title="Expand all nodes"
          >
            <ChevronsDown className="h-4 w-4 mr-2" />
            Expand All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleValidateAndPreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Form
          </Button>
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
          <Button 
            onClick={handleValidateAndSave} 
            disabled={isSaving || !hasUnsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Validate & Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Components */}
        <ComponentSidebar onAddNode={handleAddNode} />

        {/* Canvas Area */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
            minZoom={0.1}
            maxZoom={2}
          >
            <Background />
            <Controls />
            <MiniMap 
              nodeStrokeWidth={3}
              className="bg-card"
            />
            <Panel position="bottom-right" className="bg-card border rounded-lg px-3 py-2 text-xs text-muted-foreground">
              {nodes.length} nodes • {edges.length} edges
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Sidebar - Node Editor */}
        <div className="w-96 bg-card border-l flex flex-col shrink-0 overflow-hidden">
          <NodeEditorPanel
            selectedNode={selectedNode}
            onNodeUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
          />
        </div>

        {/* Flow Preview Modal */}
        <FlowPreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          flowMarkdown={flowMarkdown}
          flowId={flowId}
          flowName={flowName}
          userRole={userRole || 'client'}
        />

        {/* Validation Dialog */}
        <ValidationDialog
          open={showValidationDialog}
          onOpenChange={setShowValidationDialog}
          errors={validateFlow()}
          onConfirmSave={handleActualSave}
          onConfirmPreview={() => {
            setShowValidationDialog(false);
            setShowPreview(true);
          }}
          onNodeClick={handleNavigateToNode}
          isSaving={isSaving}
          mode={validationContext}
        />

        {/* Unsaved Changes Dialog */}
        <UnsavedChangesDialog
          open={showUnsavedChangesDialog}
          onOpenChange={setShowUnsavedChangesDialog}
          onConfirm={handleConfirmNavigation}
          onCancel={handleCancelNavigation}
        />
      </div>
    </div>
  );
}

// Helper function to convert visual flow to markdown/JSON hybrid format
function convertFlowToMarkdown(nodes: Node[], edges: Edge[]): string {
  // Handle empty flow case
  if (nodes.length === 0) {
    return `# New Flow

## Getting Started

Add components from the sidebar to build your flow:
1. Start with a **Start** node
2. Add question nodes (**Yes/No**, **Multiple Choice**, **Text Input**, etc.)
3. Connect nodes by dragging from output handles to input handles
4. Finish with an **End** or **Success** node

Once you add nodes, you'll be able to preview your flow here.

\`\`\`json
{
  "name": "New Flow",
  "description": "Add nodes to start building your flow",
  "nodes": [],
  "connections": []
}
\`\`\`
`;
  }

  // Build flow nodes from visual nodes
  const flowNodes = nodes.map(node => {
    const data = node.data as FormNodeData;
    const flowNode: any = {
      id: node.id,
      type: node.type,
      question: data.label || data.question || '',
    };

    // Add type-specific fields based on node type
    if (node.type === 'yes-no') {
      flowNode.yesLabel = data.yesLabel || 'Yes';
      flowNode.noLabel = data.noLabel || 'No';
    } else if (node.type === 'multiple-choice' && data.options) {
      flowNode.options = data.options.map((opt, idx) => ({
        id: String(idx + 1),
        label: opt
      }));
    } else if (node.type === 'form') {
      flowNode.formTitle = data.label || '';
      flowNode.formDescription = data.description || '';
      flowNode.formFields = (data.formFields || []).map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder || '',
        required: field.required || false,
        options: field.options,
        defaultValue: field.defaultValue
      }));
    } else if (node.type === 'text') {
      flowNode.placeholder = data.placeholder || '';
      flowNode.defaultValue = data.defaultValue || '';
      flowNode.fieldName = data.fieldName || '';
      flowNode.required = data.required || false;
    } else if (node.type === 'date') {
      flowNode.defaultValue = data.defaultValue || '';
      flowNode.fieldName = data.fieldName || '';
      flowNode.required = data.required || false;
    } else if (node.type === 'success' || node.type === 'end') {
      flowNode.thankYouTitle = data.label || 'Thank you!';
      flowNode.thankYouMessage = data.description || '';
    } else if (node.type === 'info') {
      flowNode.infoMessage = data.description || '';
    } else if (node.type === 'subflow') {
      flowNode.subflowId = data.subflowId || '';
    }

    return flowNode;
  });

  // Build connections from edges
  const connections = edges.map((edge, idx) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const sourceNodeData = sourceNode?.data as FormNodeData;
    let condition = 'any';
    
    // Determine condition based on node type
    if (sourceNode?.type === 'yes-no') {
      condition = edge.sourceHandle === 'yes' ? 'yes' : 'no';
    } else if (sourceNode?.type === 'multiple-choice') {
      // For multiple choice, use the option label as condition
      if (edge.data?.label && typeof edge.data.label === 'string') {
        condition = edge.data.label;
      } else if (edge.sourceHandle) {
        // Try to find the option by handle
        const options = sourceNodeData?.options || [];
        const optionIndex = parseInt(edge.sourceHandle.replace('option-', ''));
        if (!isNaN(optionIndex) && options[optionIndex]) {
          condition = options[optionIndex];
        }
      }
    } else if (edge.data?.label && typeof edge.data.label === 'string') {
      condition = edge.data.label;
    }

    return {
      id: `conn-${idx + 1}`,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      condition,
      label: edge.data?.label || ''
    };
  });

  // Find start node to get flow name
  const startNode = nodes.find(n => n.type === 'start');
  const startNodeData = startNode?.data as FormNodeData;
  const flowName = startNodeData?.label || 'Visual Flow';

  // Create the complete flow JSON
  const flowJSON = {
    name: flowName,
    description: startNodeData?.description || 'Created with visual builder',
    nodes: flowNodes,
    connections
  };

  // Generate hybrid markdown format (readable text + JSON)
  let markdown = `# ${flowName}\n\n`;
  
  if (startNodeData?.description) {
    markdown += `${startNodeData.description}\n\n`;
  }

  // Add a brief summary
  markdown += `## Flow Summary\n\n`;
  markdown += `- **Total Steps**: ${nodes.length}\n`;
  markdown += `- **Connections**: ${edges.length}\n`;
  
  const questionNodes = nodes.filter(n => 
    ['yes-no', 'multiple-choice', 'text', 'date', 'form'].includes(n.type || '')
  );
  markdown += `- **Questions**: ${questionNodes.length}\n\n`;

  // Add the JSON block for parsing
  markdown += `## Flow Structure\n\n`;
  markdown += 'The complete flow definition in JSON format:\n\n';
  markdown += '```json\n';
  markdown += JSON.stringify(flowJSON, null, 2);
  markdown += '\n```\n';

  return markdown;
}
