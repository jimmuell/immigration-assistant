'use client';

import { useCallback, useState, useRef, useMemo } from 'react';
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
import { saveFlowNodes, saveFlowEdges, updateFlowContent } from '../actions';
import type { FormNode as FormNodeType, FormEdge as FormEdgeType, NodeType, FormNodeData } from '@/types';
import { ArrowLeft, HelpCircle, Info, Save, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nodeTypes } from '@/components/flow-editor/nodes';
import ComponentSidebar from '@/components/flow-editor/ComponentSidebar';
import NodeEditorPanel from '@/components/flow-editor/NodeEditorPanel';
import { useAutoSave } from '@/hooks/useAutoSave';
import { toast } from 'sonner';
import { FlowPreviewModal } from '@/components/flow-editor/FlowPreviewModal';

interface FlowEditorClientProps {
  flowId: string;
  flowName: string;
  initialNodes: FormNodeType[];
  initialEdges: FormEdgeType[];
}

export default function FlowEditorClient({ 
  flowId, 
  flowName,
  initialNodes, 
  initialEdges 
}: FlowEditorClientProps) {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges as Edge[]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | ''>('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Convert visual flow to markdown/JSON format
  const flowMarkdown = useMemo(() => {
    return convertFlowToMarkdown(nodes, edges);
  }, [nodes, edges]);

  // Validate the flow before saving
  const validateFlow = useCallback(() => {
    const errors: string[] = [];
    
    // Check for disconnected nodes (nodes without outgoing edges, except End nodes)
    nodes.forEach(node => {
      const isEndNode = node.type === 'end' || node.type === 'success';
      const hasOutgoingEdge = edges.some(edge => edge.source === node.id);
      
      if (!isEndNode && !hasOutgoingEdge) {
        const nodeLabel = (node.data as any).label || node.type;
        errors.push(`Node "${nodeLabel}" (ID: ${node.id}) has no connections to next steps`);
      }
    });

    // Check for unsupported node types
    const supportedTypes = ['start', 'yes-no', 'text', 'form', 'end', 'success', 'multiple-choice', 'info', 'subflow', 'date'];
    nodes.forEach(node => {
      if (!supportedTypes.includes(node.type)) {
        const nodeLabel = (node.data as any).label || node.type;
        errors.push(`Node "${nodeLabel}" has unsupported type "${node.type}". Remove this node and use a different type.`);
      }
      
      // Warn about date nodes (they work in editor but not in flow renderer yet)
      if (node.type === 'date') {
        errors.push(`Date Picker nodes are not fully supported yet. Please use a Text Input node instead and ask for the date in the question.`);
      }
    });

    // Check for start node
    const hasStartNode = nodes.some(node => node.type === 'start');
    if (!hasStartNode) {
      errors.push('Flow must have a Start node');
    }

    // Check for at least one end node
    const hasEndNode = nodes.some(node => node.type === 'end' || node.type === 'success');
    if (!hasEndNode) {
      errors.push('Flow must have at least one End or Success node');
    }

    return errors;
  }, [nodes, edges]);

  const handleSave = useCallback(async () => {
    // Validate flow before saving
    const validationErrors = validateFlow();
    if (validationErrors.length > 0) {
      toast.error('Flow has validation errors', {
        description: validationErrors[0],
        duration: 5000,
      });
      console.error('Flow validation errors:', validationErrors);
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const nodesResult = await saveFlowNodes(flowId, nodes as FormNodeType[]);
      const edgesResult = await saveFlowEdges(flowId, edges as FormEdgeType[]);
      
      // Also update the flow content with the generated markdown
      await updateFlowContent(flowId, flowMarkdown);

      if (nodesResult.error || edgesResult.error) {
        setSaveStatus('error');
        toast.error('Error saving flow', {
          description: nodesResult.error || edgesResult.error
        });
      } else {
        setSaveStatus('saved');
        toast.success('Flow saved successfully');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (error) {
      setSaveStatus('error');
      toast.error('Error saving flow', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSaving(false);
    }
  }, [flowId, nodes, edges, flowMarkdown, validateFlow]);

  const { triggerAutoSave } = useAutoSave({
    delay: 3000,
    onSave: handleSave,
  });

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      triggerAutoSave();
    },
    [setEdges, triggerAutoSave]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      triggerAutoSave();
    },
    [onNodesChange, triggerAutoSave]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      triggerAutoSave();
    },
    [onEdgesChange, triggerAutoSave]
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
      triggerAutoSave();
    },
    [setNodes, triggerAutoSave]
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
      triggerAutoSave();
    },
    [reactFlowInstance, setNodes, triggerAutoSave]
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
      triggerAutoSave();
    },
    [setNodes, triggerAutoSave]
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Top Navigation */}
      <div className="h-14 bg-card border-b px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/flows')}
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
          {saveStatus && (
            <span className={`text-sm mr-2 ${
              saveStatus === 'saved' ? 'text-green-600' : 
              saveStatus === 'saving' ? 'text-muted-foreground' : 
              'text-red-600'
            }`}>
              {saveStatus === 'saved' ? '✓ Saved' : 
               saveStatus === 'saving' ? 'Saving...' : 
               'Error'}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Form
          </Button>
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
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
        />
      </div>
    </div>
  );
}

// Helper function to convert visual flow to markdown/JSON hybrid format
function convertFlowToMarkdown(nodes: Node[], edges: Edge[]): string {
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
