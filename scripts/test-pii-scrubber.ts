/**
 * Simple test script for PII Scrubber
 * Run with: npx tsx scripts/test-pii-scrubber.ts
 */

import {
  detectPII,
  containsPII,
  scrubPII,
  processMessageForQuoteThread,
  getRedactionDescription,
} from '../src/lib/pii-scrubber';

console.log('=== PII Scrubber Test Suite ===\n');

// Test cases
const testCases = [
  // Phone numbers
  { input: 'Call me at (555) 123-4567', expectPII: true, type: 'phone' },
  { input: 'My number is 555-123-4567', expectPII: true, type: 'phone' },
  { input: 'Reach me at +1 555 123 4567', expectPII: true, type: 'phone' },

  // Emails
  { input: 'Email me at john@example.com', expectPII: true, type: 'email' },
  { input: 'Contact: test.user@domain.co.uk', expectPII: true, type: 'email' },
  { input: 'john [at] example [dot] com', expectPII: true, type: 'email' },

  // URLs
  { input: 'Visit https://example.com', expectPII: true, type: 'url' },
  { input: 'Check www.mysite.com', expectPII: true, type: 'url' },
  { input: 'Find us at lawfirm.io', expectPII: true, type: 'url' },

  // Social handles
  { input: 'Follow me @johndoe', expectPII: true, type: 'social' },
  { input: 'My Instagram is @user_123', expectPII: true, type: 'social' },

  // Contact phrases
  { input: 'Please call me when you can', expectPII: true, type: 'phrase' },
  { input: 'Text me with your answer', expectPII: true, type: 'phrase' },
  { input: "Let's talk off the platform", expectPII: true, type: 'phrase' },

  // Safe messages (no PII)
  { input: 'What documents do I need?', expectPII: false, type: 'clean' },
  { input: 'The filing fee is $535', expectPII: false, type: 'clean' },
  { input: 'Processing time is 6-8 months', expectPII: false, type: 'clean' },
  { input: 'I have 3 questions about the visa', expectPII: false, type: 'clean' },
];

let passed = 0;
let failed = 0;

for (const test of testCases) {
  const hasPII = containsPII(test.input);
  const status = hasPII === test.expectPII ? '✓' : '✗';

  if (hasPII === test.expectPII) {
    passed++;
  } else {
    failed++;
  }

  console.log(`${status} [${test.type}] "${test.input.substring(0, 40)}..." → ${hasPII ? 'HAS PII' : 'CLEAN'}`);
}

console.log(`\n=== Detection Tests: ${passed}/${testCases.length} passed ===\n`);

// Test scrubbing
console.log('=== Scrubbing Test ===\n');

const complexMessage = `
Hi, I'd like to discuss my case further.
You can reach me at john@example.com or call (555) 123-4567.
Also check my website at www.mysite.com
Let's talk off the platform if possible.
`;

console.log('Original message:');
console.log(complexMessage);

const result = scrubPII(complexMessage);

console.log('\nScrubbed message:');
console.log(result.scrubbedContent);

console.log('\nMatches found:', result.matches.length);
console.log('Match types:', [...new Set(result.matches.map(m => m.type))].join(', '));
console.log('Redaction description:', getRedactionDescription(result.matches));

// Test message processing for quote threads
console.log('\n=== Quote Thread Processing Test ===\n');

const processed = processMessageForQuoteThread('My email is test@test.com, please contact me directly');
console.log('Processed result:');
console.log('  Content:', processed.content);
console.log('  PII Scrubbed:', processed.piiScrubbed);
console.log('  Details:', JSON.stringify(processed.piiScrubDetails, null, 2));

console.log('\n=== All Tests Complete ===');
console.log(`Total: ${passed} passed, ${failed} failed`);

process.exit(failed > 0 ? 1 : 0);
