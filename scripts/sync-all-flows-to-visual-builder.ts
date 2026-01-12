import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables BEFORE importing anything else
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { flows, formNodes, formEdges } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function syncAllFlowsToVisualBuilder() {
  // Create a fresh connection with the loaded env vars
  const connectionString = process.env.DATABASE_URL!;
  console.log('Connecting to:', connectionString.replace(/:([^:]+)@/, ':****@')); // Hide password
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    // Get all flows from the database
    const allFlows = await db.select().from(flows);
    
    console.log(`\n📚 Found ${allFlows.length} flows in database\n`);
    
    for (const flow of allFlows) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${flow.name}`);
      console.log(`ID: ${flow.id}`);
      
      // Check if flow already has visual builder data
      const existingNodes = await db.select().from(formNodes).where(eq(formNodes.flowId, flow.id));
      
      if (existingNodes.length > 0) {
        console.log(`✓ Already has ${existingNodes.length} visual builder nodes - skipping`);
        continue;
      }
      
      // Extract JSON from markdown content - look for the LAST json block (the full export)
      const jsonMatches = [...flow.content.matchAll(/```json\s*\n([\s\S]+?)\n```/g)];
      
      if (jsonMatches.length === 0) {
        console.log('⚠️  No JSON block found - skipping');
        continue;
      }
      
      console.log(`   Found ${jsonMatches.length} JSON blocks, using the last one`);
      
      try {
        // Get the last JSON block (should be the full export)
        const lastJsonMatch = jsonMatches[jsonMatches.length - 1];
        const flowData = JSON.parse(lastJsonMatch[1]);
        
        if (!flowData.nodes || !flowData.connections) {
          console.log('⚠️  Invalid flow data structure - skipping');
          continue;
        }
        
        console.log(`   Nodes: ${flowData.nodes.length}`);
        console.log(`   Connections: ${flowData.connections.length}`);
        
        // Create nodes with auto-layout positions
        const nodePositions = calculateAutoLayout(flowData.nodes, flowData.connections);
        
        for (const node of flowData.nodes) {
          const position = nodePositions.get(node.id) || { x: 0, y: 0 };
          
          // Build node data based on type
          const nodeData: any = {
            label: node.question,
            question: node.question,
          };
          
          if (node.type === 'yes-no') {
            nodeData.yesLabel = node.yesLabel || 'Yes';
            nodeData.noLabel = node.noLabel || 'No';
          } else if (node.type === 'multiple-choice' && node.options) {
            nodeData.options = node.options.map((opt: any) => opt.label);
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
        
        console.log(`   ✅ Created ${flowData.nodes.length} nodes`);
        
        // Create edges
        for (const connection of flowData.connections) {
          const sourceNode = flowData.nodes.find((n: any) => n.id === connection.sourceNodeId);
          let sourceHandle = null;
          
          if (sourceNode?.type === 'yes-no') {
            sourceHandle = connection.condition === 'yes' ? 'yes' : connection.condition === 'no' ? 'no' : null;
          } else if (sourceNode?.type === 'multiple-choice') {
            // Find the option index for this condition
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
        
        console.log(`   ✅ Created ${flowData.connections.length} edges`);
        console.log('   🎉 Successfully synced!');
        
      } catch (error) {
        console.log('   ❌ Error processing flow:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('\n✅ All flows processed!');
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing flows:', error);
    await client.end();
    process.exit(1);
  }
}

// Calculate auto-layout positions for nodes
function calculateAutoLayout(
  nodes: any[],
  connections: any[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();
  const layers = new Map<string, number>();
  
  // Find start node
  const startNode = nodes.find(n => n.type === 'start');
  if (!startNode) {
    // If no start node, just place them in a grid
    nodes.forEach((node, i) => {
      positions.set(node.id, {
        x: (i % 3) * 350,
        y: Math.floor(i / 3) * 200,
      });
    });
    return positions;
  }
  
  // BFS to assign layers
  const queue: Array<{ nodeId: string; layer: number }> = [{ nodeId: startNode.id, layer: 0 }];
  layers.set(startNode.id, 0);
  
  while (queue.length > 0) {
    const { nodeId, layer } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    // Find all outgoing connections
    const outgoing = connections.filter(c => c.sourceNodeId === nodeId);
    
    for (const conn of outgoing) {
      if (!layers.has(conn.targetNodeId)) {
        layers.set(conn.targetNodeId, layer + 1);
        queue.push({ nodeId: conn.targetNodeId, layer: layer + 1 });
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
  
  // Assign positions
  const horizontalSpacing = 350;
  const verticalSpacing = 200;
  
  for (const [layer, nodeIds] of nodesByLayer.entries()) {
    nodeIds.forEach((nodeId, index) => {
      const totalInLayer = nodeIds.length;
      const offsetY = (index - (totalInLayer - 1) / 2) * verticalSpacing;
      
      positions.set(nodeId, {
        x: layer * horizontalSpacing,
        y: offsetY,
      });
    });
  }
  
  // Handle any nodes that weren't reached (disconnected nodes)
  nodes.forEach((node, i) => {
    if (!positions.has(node.id)) {
      positions.set(node.id, {
        x: 0,
        y: (i + 10) * 200,
      });
    }
  });
  
  return positions;
}

syncAllFlowsToVisualBuilder();

