import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the database flow
const dbFlowPath = resolve(__dirname, '../temp-db-flow.json');
const dbFlow = JSON.parse(readFileSync(dbFlowPath, 'utf-8'));

// Read the attached file flow
const attachedFlowPath = '/Users/jameslmueller/Projects/flow files/Asylum or Protection From Persecution-ai-prompt.md';
const attachedContent = readFileSync(attachedFlowPath, 'utf-8');

// Extract JSON from attached file (last json block)
const jsonMatches = [...attachedContent.matchAll(/```json\s*\n([\s\S]+?)\n```/g)];
const attachedFlow = JSON.parse(jsonMatches[jsonMatches.length - 1][1]);

console.log('=== COMPARISON RESULTS ===\n');

// Compare basic structure
console.log('Database Flow:');
console.log(`  - Name: ${dbFlow.name}`);
console.log(`  - Nodes: ${dbFlow.nodes?.length || 0}`);
console.log(`  - Connections: ${dbFlow.connections?.length || 0}`);

console.log('\nAttached File Flow:');
console.log(`  - Name: ${attachedFlow.name}`);
console.log(`  - Nodes: ${attachedFlow.nodes?.length || 0}`);
console.log(`  - Connections: ${attachedFlow.connections?.length || 0}`);

// Deep comparison
const dbJson = JSON.stringify(dbFlow, null, 2);
const attachedJson = JSON.stringify(attachedFlow, null, 2);

if (dbJson === attachedJson) {
  console.log('\n✅ FILES ARE IDENTICAL');
} else {
  console.log('\n❌ FILES ARE DIFFERENT');
  
  // Find differences
  console.log('\nDifferences found:');
  
  // Compare nodes
  const dbNodeIds = new Set(dbFlow.nodes?.map((n: any) => n.id) || []);
  const attachedNodeIds = new Set(attachedFlow.nodes?.map((n: any) => n.id) || []);
  
  const missingInDb = [...attachedNodeIds].filter(id => !dbNodeIds.has(id));
  const missingInAttached = [...dbNodeIds].filter(id => !attachedNodeIds.has(id));
  
  if (missingInDb.length > 0) {
    console.log(`  - Nodes missing in DB: ${missingInDb.join(', ')}`);
  }
  if (missingInAttached.length > 0) {
    console.log(`  - Nodes missing in attached file: ${missingInAttached.join(', ')}`);
  }
  
  // Compare connections
  const dbConnIds = new Set(dbFlow.connections?.map((c: any) => c.id) || []);
  const attachedConnIds = new Set(attachedFlow.connections?.map((c: any) => c.id) || []);
  
  const connMissingInDb = [...attachedConnIds].filter(id => !dbConnIds.has(id));
  const connMissingInAttached = [...dbConnIds].filter(id => !attachedConnIds.has(id));
  
  if (connMissingInDb.length > 0) {
    console.log(`  - Connections missing in DB: ${connMissingInDb.join(', ')}`);
  }
  if (connMissingInAttached.length > 0) {
    console.log(`  - Connections missing in attached file: ${connMissingInAttached.join(', ')}`);
  }
  
  // Check if just ordering is different
  const dbSorted = JSON.stringify(sortFlow(dbFlow));
  const attachedSorted = JSON.stringify(sortFlow(attachedFlow));
  
  if (dbSorted === attachedSorted) {
    console.log('\n  Note: Content is identical, just in different order');
  }
}

function sortFlow(flow: any) {
  return {
    ...flow,
    nodes: flow.nodes?.sort((a: any, b: any) => a.id.localeCompare(b.id)),
    connections: flow.connections?.sort((a: any, b: any) => a.id.localeCompare(b.id))
  };
}
