import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables BEFORE importing anything else
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { flows, formNodes, formEdges } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function verifyVisualBuilderData() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    const flowName = 'Asylum or Protection From Persecution-ai-prompt';
    
    // Get the flow
    const [flow] = await db.select().from(flows).where(eq(flows.name, flowName));
    
    if (!flow) {
      console.log('❌ Flow not found');
      await client.end();
      process.exit(1);
    }
    
    console.log('📊 Visual Builder Data Verification');
    console.log('=' .repeat(60));
    console.log(`\nFlow: ${flow.name}`);
    console.log(`ID: ${flow.id}\n`);
    
    // Get nodes
    const nodes = await db.select().from(formNodes).where(eq(formNodes.flowId, flow.id));
    console.log(`✓ Nodes: ${nodes.length}`);
    
    if (nodes.length > 0) {
      console.log('\nNode Types:');
      const nodeTypes = new Map<string, number>();
      nodes.forEach(node => {
        const count = nodeTypes.get(node.type) || 0;
        nodeTypes.set(node.type, count + 1);
      });
      
      for (const [type, count] of nodeTypes.entries()) {
        console.log(`  - ${type}: ${count}`);
      }
      
      console.log('\nSample Nodes:');
      nodes.slice(0, 3).forEach(node => {
        const data = node.data as any;
        console.log(`  - [${node.type}] ${data.label || data.question || 'No label'}`);
        console.log(`    Position: (${(node.position as any).x}, ${(node.position as any).y})`);
      });
    }
    
    // Get edges
    const edges = await db.select().from(formEdges).where(eq(formEdges.flowId, flow.id));
    console.log(`\n✓ Edges: ${edges.length}`);
    
    if (edges.length > 0) {
      console.log('\nSample Edges:');
      edges.slice(0, 3).forEach(edge => {
        const sourceNode = nodes.find(n => n.nodeId === edge.source);
        const targetNode = nodes.find(n => n.nodeId === edge.target);
        const sourceLabel = sourceNode ? (sourceNode.data as any).label || (sourceNode.data as any).question : 'Unknown';
        const targetLabel = targetNode ? (targetNode.data as any).label || (targetNode.data as any).question : 'Unknown';
        
        console.log(`  - ${sourceLabel.substring(0, 30)}...`);
        console.log(`    → ${targetLabel.substring(0, 30)}...`);
        if (edge.sourceHandle) {
          console.log(`    Handle: ${edge.sourceHandle}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (nodes.length > 0 && edges.length > 0) {
      console.log('\n✅ Visual builder data is properly configured!');
      console.log('   The canvas should now display the flow correctly.');
    } else {
      console.log('\n⚠️  Visual builder data is incomplete.');
      console.log('   Run: npx tsx scripts/sync-flow-to-visual-builder.ts');
    }
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

verifyVisualBuilderData();

