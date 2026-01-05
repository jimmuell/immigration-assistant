import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables BEFORE importing anything else
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { flows } from '../src/lib/db/schema';

async function checkFlow() {
  // Create a fresh connection with the loaded env vars
  const connectionString = process.env.DATABASE_URL!;
  console.log('Connecting to:', connectionString.replace(/:([^:]+)@/, ':****@')); // Hide password
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  const allFlows = await db.select().from(flows);
  console.log(`\nFound ${allFlows.length} flows:\n`);
  
  allFlows.forEach(flow => {
    console.log(`ID: ${flow.id}`);
    console.log(`Name: ${flow.name}`);
    console.log(`Description: ${flow.description}`);
    console.log(`Active: ${flow.isActive}`);
    console.log(`Content length: ${flow.content?.length || 0} characters`);
    
    // Check if content has JSON
    if (flow.content) {
      const hasJSON = flow.content.includes('```json');
      console.log(`Has JSON structure: ${hasJSON}`);
      
      if (hasJSON) {
        // Try to extract and parse - look for the LAST json block (the full export)
        try {
          const jsonMatches = [...flow.content.matchAll(/```json\s*\n([\s\S]+?)\n```/g)];
          if (jsonMatches.length > 0) {
            // Get the last JSON block (should be the full export)
            const lastJsonMatch = jsonMatches[jsonMatches.length - 1];
            const flowData = JSON.parse(lastJsonMatch[1]);
            console.log(`  - Nodes: ${flowData.nodes?.length || 0}`);
            console.log(`  - Connections: ${flowData.connections?.length || 0}`);
            console.log(`  - Flow name: ${flowData.name || 'not found'}`);
            console.log(`  - Start node: ${flowData.nodes?.find((n: any) => n.type === 'start')?.id || 'not found'}`);
            
            // Write full JSON to file for comparison
            const fs = require('fs');
            const path = require('path');
            const outputPath = path.resolve(__dirname, '../temp-db-flow.json');
            fs.writeFileSync(outputPath, JSON.stringify(flowData, null, 2));
            console.log(`  - Full JSON written to: ${outputPath}`);
          }
        } catch (e) {
          console.log(`  - JSON parse error: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
      }
    }
    console.log('---\n');
  });
  
  // Look for the specific flow the user mentioned
  const targetFlow = allFlows.find(f => f.id === '400ea8d3-426c-45ff-9299-dfb1ca587beb');
  if (targetFlow) {
    console.log('✓ Found the target flow!');
    console.log('Name:', targetFlow.name);
  } else {
    console.log('✗ Target flow 400ea8d3-426c-45ff-9299-dfb1ca587beb not found');
  }
  
  await client.end();
}

checkFlow();
