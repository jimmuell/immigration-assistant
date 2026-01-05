import { db } from '../src/lib/db';
import { flows } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function updateFlow() {
  try {
    // Read the updated flow from temp-db-flow.json
    const flowPath = resolve(__dirname, '../temp-db-flow.json');
    const flowJson = readFileSync(flowPath, 'utf-8');
    const flowData = JSON.parse(flowJson);
    
    console.log('📖 Read flow from temp-db-flow.json');
    console.log(`   Name: ${flowData.name}`);
    console.log(`   Nodes: ${flowData.nodes.length}`);
    console.log(`   Connections: ${flowData.connections.length}`);
    
    // Create markdown content with JSON block
    const markdownContent = `# ${flowData.name}\n\n\`\`\`json\n${JSON.stringify(flowData, null, 2)}\n\`\`\``;
    
    // Find the flow in the database by name
    const existingFlows = await db.select().from(flows).where(eq(flows.name, flowData.name));
    
    if (existingFlows.length === 0) {
      console.log('\n❌ No flow found with name:', flowData.name);
      console.log('   Available flows in database:');
      const allFlows = await db.select().from(flows);
      allFlows.forEach(f => console.log(`   - ${f.name}`));
      process.exit(1);
    }
    
    const flowId = existingFlows[0].id;
    console.log(`\n🔄 Updating flow ID: ${flowId}`);
    
    // Update the flow
    await db.update(flows)
      .set({
        content: markdownContent,
        updatedAt: new Date(),
      })
      .where(eq(flows.id, flowId));
    
    console.log('✅ Flow updated successfully!');
    console.log('   Refresh the admin page to see the changes.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating flow:', error);
    process.exit(1);
  }
}

updateFlow();
