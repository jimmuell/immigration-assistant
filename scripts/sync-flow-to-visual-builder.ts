import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables BEFORE importing anything else
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { flows, formNodes, formEdges } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function syncFlowToVisualBuilder() {
  // Create a fresh connection with the loaded env vars
  const connectionString = process.env.DATABASE_URL!;
  console.log('Connecting to:', connectionString.replace(/:([^:]+)@/, ':****@')); // Hide password
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    const flowName = 'Asylum or Protection From Persecution-ai-prompt (1)';
    
    // Get the flow from the database
    const [flow] = await db.select().from(flows).where(eq(flows.name, flowName));
    
    if (!flow) {
      console.log('\n❌ Flow not found:', flowName);
      console.log('   Available flows in database:');
      const allFlows = await db.select().from(flows);
      allFlows.forEach(f => console.log(`   - ${f.name}`));
      process.exit(1);
    }
    
    console.log('📖 Found flow:', flow.name);
    console.log('   ID:', flow.id);
    
    // Extract JSON from markdown content - look for the LAST json block (the full export)
    const jsonMatches = [...flow.content.matchAll(/```json\s*\n([\s\S]+?)\n```/g)];
    
    if (jsonMatches.length === 0) {
      console.log('\n❌ No JSON block found in flow content');
      console.log('Content preview:', flow.content.substring(0, 200));
      await client.end();
      process.exit(1);
    }
    
    console.log(`   Found ${jsonMatches.length} JSON blocks, using the last one`);
    
    // Get the last JSON block (should be the full export)
    const lastJsonMatch = jsonMatches[jsonMatches.length - 1];
    const flowData = JSON.parse(lastJsonMatch[1]);
    
    if (!flowData.nodes || !flowData.connections) {
      console.log('\n❌ Invalid flow data structure');
      console.log('Flow data:', JSON.stringify(flowData, null, 2).substring(0, 500));
      await client.end();
      process.exit(1);
    }
    
    console.log(`   Nodes: ${flowData.nodes.length}`);
    console.log(`   Connections: ${flowData.connections.length}`);
    
    // Delete existing visual builder data for this flow
    await db.delete(formNodes).where(eq(formNodes.flowId, flow.id));
    await db.delete(formEdges).where(eq(formEdges.flowId, flow.id));
    console.log('\n🗑️  Cleared existing visual builder data');
    
    // Create nodes with auto-layout positions
    const nodePositions = calculateAutoLayout(flowData.nodes, flowData.connections);
    
    for (const node of flowData.nodes) {
      const position = nodePositions.get(node.id) || { x: 0, y: 0 };
      
      // Build node data based on type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeData: any = {
        label: node.question,
        question: node.question,
      };
      
      if (node.type === 'yes-no') {
        nodeData.yesLabel = node.yesLabel || 'Yes';
        nodeData.noLabel = node.noLabel || 'No';
      } else if (node.type === 'multiple-choice' && node.options) {
        nodeData.options = node.options.map((opt: { label: string }) => opt.label);
      } else if (node.type === 'form') {
        nodeData.label = node.formTitle || node.question;
        nodeData.description = node.formDescription || '';
        nodeData.formFields = node.formFields || [];
      } else if (node.type === 'text') {
        nodeData.placeholder = node.placeholder || '';
        nodeData.defaultValue = node.defaultValue || '';
        nodeData.fieldName = node.fieldName || '';
        nodeData.required = node.required || false;
      } else if (node.type === 'date') {
        nodeData.defaultValue = node.defaultValue || '';
        nodeData.fieldName = node.fieldName || '';
        nodeData.required = node.required || false;
      } else if (node.type === 'end' || node.type === 'success') {
        nodeData.label = node.thankYouTitle || 'Thank you!';
        nodeData.description = node.thankYouMessage || '';
      } else if (node.type === 'info') {
        nodeData.description = node.infoMessage || '';
      } else if (node.type === 'subflow') {
        nodeData.subflowId = node.subflowId || '';
      } else if (node.type === 'start') {
        nodeData.label = flowData.name;
        nodeData.description = flowData.description || '';
      }
      
      await db.insert(formNodes).values({
        flowId: flow.id,
        nodeId: node.id,
        type: node.type,
        data: nodeData,
        position: position,
      });
    }
    
    console.log('✅ Created', flowData.nodes.length, 'nodes');
    
    // Create edges
    for (const connection of flowData.connections) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sourceNode = flowData.nodes.find((n: any) => n.id === connection.sourceNodeId);
      let sourceHandle = null;
      
      if (sourceNode?.type === 'yes-no') {
        sourceHandle = connection.condition === 'yes' ? 'yes' : connection.condition === 'no' ? 'no' : null;
      } else if (sourceNode?.type === 'multiple-choice') {
        // Find the option index for this condition
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const optionIndex = sourceNode.options?.findIndex((opt: any) => opt.label === connection.condition);
        if (optionIndex !== undefined && optionIndex >= 0) {
          sourceHandle = `option-${optionIndex}`;
        }
      }
      
      await db.insert(formEdges).values({
        flowId: flow.id,
        edgeId: connection.id,
        source: connection.sourceNodeId,
        target: connection.targetNodeId,
        sourceHandle: sourceHandle,
        targetHandle: null,
        data: connection.label ? { label: connection.label } : null,
      });
    }
    
    console.log('✅ Created', flowData.connections.length, 'edges');
    console.log('\n🎉 Visual builder data synced successfully!');
    console.log('   You can now open the visual builder for this flow.');
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing flow:', error);
    await client.end();
    process.exit(1);
  }
}

// Calculate auto-layout positions for nodes
function calculateAutoLayout(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connections: any[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();
  const layers = new Map<string, number>();
  
  // Layout configuration for better spacing
  const HORIZONTAL_SPACING = 450; // Increased from 350
  const VERTICAL_SPACING = 250;   // Increased from 200
  const START_X = 100;             // Left padding
  const START_Y = 100;             // Top padding
  
  // Find start node
  const startNode = nodes.find(n => n.type === 'start');
  if (!startNode) {
    // If no start node, just place them in a grid
    nodes.forEach((node, i) => {
      positions.set(node.id, {
        x: START_X + (i % 3) * HORIZONTAL_SPACING,
        y: START_Y + Math.floor(i / 3) * VERTICAL_SPACING,
      });
    });
    return positions;
  }
  
  // BFS to assign layers, with proper handling of back edges
  const queue: Array<{ nodeId: string; layer: number }> = [{ nodeId: startNode.id, layer: 0 }];
  layers.set(startNode.id, 0);
  
  while (queue.length > 0) {
    const { nodeId, layer } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    // Find all outgoing connections
    const outgoing = connections.filter(c => c.sourceNodeId === nodeId);
    
    for (const conn of outgoing) {
      const targetId = conn.targetNodeId;
      const newLayer = layer + 1;
      
      // Only assign layer if not yet assigned, or if this would put it in a later layer
      if (!layers.has(targetId) || layers.get(targetId)! < newLayer) {
        layers.set(targetId, newLayer);
        queue.push({ nodeId: targetId, layer: newLayer });
      }
    }
  }
  
  // Group nodes by layer
  const nodesByLayer = new Map<number, string[]>();
  for (const [nodeId, layer] of layers.entries()) {
    if (!nodesByLayer.has(layer)) {
      nodesByLayer.set(layer, []);
    }
    nodesByLayer.get(layer)!.push(nodeId);
  }
  
  // Sort each layer to minimize edge crossings
  // Simple heuristic: sort by average position of parent nodes
  for (const [layer, nodeIds] of nodesByLayer.entries()) {
    if (layer === 0) continue; // Skip start node
    
    nodeIds.sort((a, b) => {
      const aParents = connections.filter(c => c.targetNodeId === a).map(c => c.sourceNodeId);
      const bParents = connections.filter(c => c.targetNodeId === b).map(c => c.sourceNodeId);
      
      const aAvg = aParents.reduce((sum, p) => sum + (positions.get(p)?.y || 0), 0) / (aParents.length || 1);
      const bAvg = bParents.reduce((sum, p) => sum + (positions.get(p)?.y || 0), 0) / (bParents.length || 1);
      
      return aAvg - bAvg;
    });
  }
  
  // Assign positions with improved spacing
  for (const [layer, nodeIds] of nodesByLayer.entries()) {
    const totalInLayer = nodeIds.length;
    
    nodeIds.forEach((nodeId, index) => {
      // Calculate Y position with better distribution
      // Use absolute positioning instead of centered to avoid negative values
      const y = START_Y + index * VERTICAL_SPACING;
      
      // Calculate X position based on layer
      const x = START_X + layer * HORIZONTAL_SPACING;
      
      positions.set(nodeId, { x, y });
    });
  }
  
  // Handle any nodes that weren't reached (disconnected nodes)
  // Place them at the bottom right
  let disconnectedIndex = 0;
  nodes.forEach((node) => {
    if (!positions.has(node.id)) {
      const maxLayer = Math.max(...Array.from(nodesByLayer.keys()));
      positions.set(node.id, {
        x: START_X + (maxLayer + 2) * HORIZONTAL_SPACING,
        y: START_Y + disconnectedIndex * VERTICAL_SPACING,
      });
      disconnectedIndex++;
    }
  });
  
  return positions;
}

syncFlowToVisualBuilder();

