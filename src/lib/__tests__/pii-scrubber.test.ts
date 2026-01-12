/**
 * PII Scrubber Unit Tests
 */

import {
  detectPII,
  containsPII,
  scrubPII,
  processMessageForQuoteThread,
  validateNoPII,
  isMessageSafe,
  getRedactionDescription,
  getPIISummary,
  type PIIMatch,
} from '../pii-scrubber';

describe('PII Scrubber', () => {
  // ============================================================================
  // PHONE NUMBER DETECTION
  // ============================================================================
  describe('Phone Number Detection', () => {
    const phoneTestCases = [
      { input: 'Call me at (555) 123-4567', expected: true, description: 'US format with parentheses' },
      { input: 'My number is 555-123-4567', expected: true, description: 'US format with dashes' },
      { input: 'Reach me at 555.123.4567', expected: true, description: 'US format with dots' },
      { input: 'Phone: 5551234567', expected: true, description: 'US format no separators' },
      { input: 'Call +1 555 123 4567', expected: true, description: 'International format' },
      { input: '+44 20 7123 4567', expected: true, description: 'UK format' },
      { input: 'I have 3 questions', expected: false, description: 'Short number (not phone)' },
      { input: 'The price is $1234', expected: false, description: 'Price (not phone)' },
    ];

    phoneTestCases.forEach(({ input, expected, description }) => {
      it(`should ${expected ? 'detect' : 'not detect'} phone in: ${description}`, () => {
        const matches = detectPII(input);
        const hasPhone = matches.some(m => m.type === 'phone_number');
        expect(hasPhone).toBe(expected);
      });
    });
  });

  // ============================================================================
  // EMAIL ADDRESS DETECTION
  // ============================================================================
  describe('Email Address Detection', () => {
    const emailTestCases = [
      { input: 'Email me at john@example.com', expected: true, description: 'Standard email' },
      { input: 'Contact: test.user+tag@domain.co.uk', expected: true, description: 'Complex email' },
      { input: 'Reach me at john [at] example [dot] com', expected: true, description: 'Obfuscated email' },
      { input: 'john at example dot com', expected: true, description: 'Written out email' },
      { input: 'The meeting is at 3pm', expected: false, description: '"at" in sentence (not email)' },
      { input: 'Look at this document', expected: false, description: '"at" word (not email)' },
    ];

    emailTestCases.forEach(({ input, expected, description }) => {
      it(`should ${expected ? 'detect' : 'not detect'} email in: ${description}`, () => {
        const matches = detectPII(input);
        const hasEmail = matches.some(m => m.type === 'email_address');
        expect(hasEmail).toBe(expected);
      });
    });
  });

  // ============================================================================
  // URL DETECTION
  // ============================================================================
  describe('URL Detection', () => {
    const urlTestCases = [
      { input: 'Visit https://example.com', expected: true, description: 'HTTPS URL' },
      { input: 'Go to http://test.org/page', expected: true, description: 'HTTP URL with path' },
      { input: 'Check www.mysite.com', expected: true, description: 'www URL' },
      { input: 'My site is mywebsite.com', expected: true, description: 'Domain without protocol' },
      { input: 'Find us at lawfirm.io', expected: true, description: '.io domain' },
      { input: 'Use the app at myapp.dev', expected: true, description: '.dev domain' },
      { input: 'The document.pdf is ready', expected: false, description: 'File extension (not URL)' },
    ];

    urlTestCases.forEach(({ input, expected, description }) => {
      it(`should ${expected ? 'detect' : 'not detect'} URL in: ${description}`, () => {
        const matches = detectPII(input);
        const hasUrl = matches.some(m => m.type === 'url');
        expect(hasUrl).toBe(expected);
      });
    });
  });

  // ============================================================================
  // SOCIAL HANDLE DETECTION
  // ============================================================================
  describe('Social Handle Detection', () => {
    const socialTestCases = [
      { input: 'Follow me @johndoe', expected: true, description: 'Twitter-style handle' },
      { input: 'My Instagram is @user_123', expected: true, description: 'Instagram handle' },
      { input: 'Find me on Instagram: johndoe', expected: true, description: 'Instagram mention' },
      { input: 'WhatsApp me at john_smith', expected: true, description: 'WhatsApp mention' },
      { input: 'Connect on LinkedIn: johnsmith', expected: true, description: 'LinkedIn mention' },
      { input: 'I am @ a loss', expected: false, description: '"@" in sentence (not handle)' },
    ];

    socialTestCases.forEach(({ input, expected, description }) => {
      it(`should ${expected ? 'detect' : 'not detect'} social handle in: ${description}`, () => {
        const matches = detectPII(input);
        const hasSocial = matches.some(m => m.type === 'social_handle');
        expect(hasSocial).toBe(expected);
      });
    });
  });

  // ============================================================================
  // CONTACT PHRASE DETECTION
  // ============================================================================
  describe('Contact Phrase Detection', () => {
    const phraseTestCases = [
      { input: 'Please call me when you can', expected: true, description: 'Call me' },
      { input: 'Text me with your answer', expected: true, description: 'Text me' },
      { input: 'Give me a call tomorrow', expected: true, description: 'Give me a call' },
      { input: 'My phone number is listed below', expected: true, description: 'My phone is' },
      { input: 'Here is my email for reference', expected: true, description: 'Here is my email' },
      { input: "Let's talk off the platform", expected: true, description: 'Off platform' },
      { input: 'Reach me at the office', expected: true, description: 'Reach me at' },
      { input: "Let's connect outside the app", expected: true, description: 'Outside the app' },
      { input: 'Please contact me directly', expected: true, description: 'Contact me directly' },
      { input: 'I will call the office', expected: false, description: '"call" not soliciting' },
      { input: 'The text says otherwise', expected: false, description: '"text" as noun' },
    ];

    phraseTestCases.forEach(({ input, expected, description }) => {
      it(`should ${expected ? 'detect' : 'not detect'} contact phrase in: ${description}`, () => {
        const matches = detectPII(input);
        const hasPhrase = matches.some(m => m.type === 'contact_phrase');
        expect(hasPhrase).toBe(expected);
      });
    });
  });

  // ============================================================================
  // SCRUBBING FUNCTIONALITY
  // ============================================================================
  describe('PII Scrubbing', () => {
    it('should replace detected PII with [REDACTED]', () => {
      const input = 'Contact me at john@example.com or call 555-123-4567';
      const result = scrubPII(input);

      expect(result.wasScubbed).toBe(true);
      expect(result.scrubbedContent).toContain('[REDACTED]');
      expect(result.scrubbedContent).not.toContain('john@example.com');
      expect(result.scrubbedContent).not.toContain('555-123-4567');
      expect(result.originalContent).toBe(input);
    });

    it('should preserve text without PII', () => {
      const input = 'I have a question about the immigration process.';
      const result = scrubPII(input);

      expect(result.wasScubbed).toBe(false);
      expect(result.scrubbedContent).toBe(input);
      expect(result.matches).toHaveLength(0);
    });

    it('should handle multiple PII types in one message', () => {
      const input = 'Email john@test.com, call 555-1234567, or visit www.mysite.com';
      const result = scrubPII(input);

      expect(result.wasScubbed).toBe(true);
      expect(result.matches.length).toBeGreaterThanOrEqual(3);

      const types = result.matches.map(m => m.type);
      expect(types).toContain('email_address');
      expect(types).toContain('phone_number');
      expect(types).toContain('url');
    });
  });

  // ============================================================================
  // MESSAGE PROCESSING
  // ============================================================================
  describe('Message Processing', () => {
    it('should process clean messages without changes', () => {
      const content = 'What documents do I need for my visa application?';
      const result = processMessageForQuoteThread(content);

      expect(result.piiScrubbed).toBe(false);
      expect(result.content).toBe(content);
      expect(result.originalContent).toBeNull();
      expect(result.piiScrubDetails).toBeNull();
    });

    it('should process and track PII details', () => {
      const content = 'Call me at 555-123-4567 to discuss';
      const result = processMessageForQuoteThread(content);

      expect(result.piiScrubbed).toBe(true);
      expect(result.content).toContain('[REDACTED]');
      expect(result.originalContent).toBe(content);
      expect(result.piiScrubDetails).not.toBeNull();
      expect(result.piiScrubDetails?.matchCount).toBeGreaterThan(0);
      expect(result.piiScrubDetails?.types).toContain('phone_number');
    });
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================
  describe('Validation', () => {
    it('should pass validation for clean text', () => {
      expect(() => validateNoPII('This is a clean message')).not.toThrow();
    });

    it('should throw error for text with PII', () => {
      expect(() => validateNoPII('Call me at 555-123-4567')).toThrow();
    });

    it('should return true for safe messages', () => {
      expect(isMessageSafe('What are the fees for this service?')).toBe(true);
    });

    it('should return false for unsafe messages', () => {
      expect(isMessageSafe('My email is test@example.com')).toBe(false);
    });
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  describe('Helper Functions', () => {
    it('should generate correct redaction description', () => {
      const matches: PIIMatch[] = [
        { type: 'phone_number', value: '555-1234', startIndex: 0, endIndex: 8 },
        { type: 'email_address', value: 'a@b.com', startIndex: 10, endIndex: 17 },
      ];

      const description = getRedactionDescription(matches);
      expect(description).toContain('1 phone number');
      expect(description).toContain('1 email address');
    });

    it('should return correct PII summary', () => {
      const matches: PIIMatch[] = [
        { type: 'phone_number', value: '1', startIndex: 0, endIndex: 1 },
        { type: 'phone_number', value: '2', startIndex: 2, endIndex: 3 },
        { type: 'email_address', value: '3', startIndex: 4, endIndex: 5 },
      ];

      const summary = getPIISummary(matches);
      expect(summary.phone_number).toBe(2);
      expect(summary.email_address).toBe(1);
      expect(summary.url).toBe(0);
    });

    it('should correctly identify if text contains PII', () => {
      expect(containsPII('Clean text here')).toBe(false);
      expect(containsPII('Call 555-123-4567')).toBe(true);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = scrubPII('');
      expect(result.wasScubbed).toBe(false);
      expect(result.scrubbedContent).toBe('');
    });

    it('should handle string with only whitespace', () => {
      const result = scrubPII('   \n\t   ');
      expect(result.wasScubbed).toBe(false);
    });

    it('should handle very long text', () => {
      const longText = 'This is a test. '.repeat(1000) + 'Call me at 555-123-4567';
      const result = scrubPII(longText);
      expect(result.wasScubbed).toBe(true);
    });

    it('should handle unicode characters', () => {
      const unicodeText = 'Hola! Mi email es test@ejemplo.com 🇲🇽';
      const result = scrubPII(unicodeText);
      expect(result.wasScubbed).toBe(true);
      expect(result.scrubbedContent).toContain('🇲🇽');
    });

    it('should not flag legitimate business discussions', () => {
      const businessText = `
        The filing fee is $535.
        Processing time is 6-8 months.
        We need form I-130 and I-485.
        The appointment is at 10am on Monday.
      `;
      expect(containsPII(businessText)).toBe(false);
    });
  });
});
