/**
 * Unit tests for Text resolver
 */

import { describe, it, expect } from 'vitest';
import { resolveTextInsight, parseTextConfig, simpleTextMatch } from '../../lib/resolvers/text';

describe('Text Resolver', () => {
  describe('Basic Text Matching', () => {
    it('should find exact substring matches', async () => {
      const config = {
        expect: 'project completed'
      };

      const result = await resolveTextInsight(
        'Project completion status',
        config,
        'The project completed successfully yesterday'
      );

      expect(result.proposed).toBe('YES');
      expect(result.confidence).toBe(0.95);
      expect(result.evidence.matchType).toBe('exact');
    });

    it('should handle case insensitive matching', async () => {
      const config = {
        expect: 'PROJECT COMPLETED',
        caseSensitive: false
      };

      const result = await resolveTextInsight(
        'Project completion status',
        config,
        'the project completed successfully'
      );

      expect(result.proposed).toBe('YES');
      expect(result.confidence).toBe(0.95);
    });

    it('should handle case sensitive matching', async () => {
      const config = {
        expect: 'Project Completed',
        caseSensitive: true
      };

      const result = await resolveTextInsight(
        'Project completion status',
        config,
        'the project completed successfully'
      );

      expect(result.proposed).toBe('NO');
    });

    it('should require exact match when specified', async () => {
      const config = {
        expect: 'project completed',
        exactMatch: true
      };

      const result = await resolveTextInsight(
        'Project completion status',
        config,
        'project completed'
      );

      expect(result.proposed).toBe('YES');
      expect(result.confidence).toBe(1.0);
      expect(result.evidence.matchType).toBe('exact');
    });

    it('should fail exact match when text differs', async () => {
      const config = {
        expect: 'project completed',
        exactMatch: true
      };

      const result = await resolveTextInsight(
        'Project completion status',
        config,
        'project completed successfully'
      );

      expect(result.proposed).toBe('NO');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('Keyword Matching', () => {
    it('should match using provided keywords', async () => {
      const config = {
        expect: 'project status',
        keywords: ['project', 'completed', 'finished']
      };

      const result = await resolveTextInsight(
        'Project completion check',
        config,
        'The major project was completed on time and finished successfully'
      );

      expect(result.proposed).toBe('YES');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.evidence.matchType).toBe('keyword');
      expect(result.evidence.matchedKeywords).toContain('project');
      expect(result.evidence.matchedKeywords).toContain('completed');
    });

    it('should auto-extract keywords when not provided', async () => {
      const config = {
        expect: 'project completed successfully'
      };

      const result = await resolveTextInsight(
        'Project completion status',
        config,
        'Our major project was completed and delivered successfully to the client'
      );

      expect(result.proposed).toBe('YES');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.evidence.matchType).toBe('keyword');
    });

    it('should filter out common stop words', async () => {
      const config = {
        expect: 'the project and the team completed the work'
      };

      const result = await resolveTextInsight(
        'Work completion',
        config,
        'project team completed work successfully'
      );

      expect(result.proposed).toBe('YES');
      // Should match on meaningful words like 'project', 'team', 'completed', 'work'
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle partial keyword matches', async () => {
      const config = {
        expect: 'project completion',
        keywords: ['project', 'complete', 'done']
      };

      const result = await resolveTextInsight(
        'Project status',
        config,
        'The project is completed and we are done with all tasks'
      );

      expect(result.proposed).toBe('YES');
      expect(result.evidence.matchedKeywords).toContain('project');
      expect(result.evidence.matchedKeywords).toContain('complete'); // Should match 'completed'
    });
  });

  describe('Confidence Levels', () => {
    it('should return high confidence for strong matches', async () => {
      const config = {
        expect: 'project completed successfully'
      };

      const result = await resolveTextInsight(
        'Project status',
        config,
        'The project completed successfully with all requirements met'
      );

      expect(result.proposed).toBe('YES');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should return null for ambiguous matches', async () => {
      const config = {
        expect: 'project completed successfully with all features'
      };

      const result = await resolveTextInsight(
        'Project status',
        config,
        'The project is ongoing'
      );

      expect(result.proposed).toBe(null);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.reasoning).toContain('manual review recommended');
    });

    it('should return NO for clear non-matches', async () => {
      const config = {
        expect: 'project completed successfully'
      };

      const result = await resolveTextInsight(
        'Project status',
        config,
        'The project failed and was cancelled due to budget constraints'
      );

      expect(result.proposed).toBe('NO');
      expect(result.confidence).toBeLessThan(0.3);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing actual text', async () => {
      const config = {
        expect: 'project completed'
      };

      const result = await resolveTextInsight('Project status', config);

      expect(result.proposed).toBe(null);
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain('No actual text provided');
    });

    it('should handle empty expected text', async () => {
      const config = {
        expect: ''
      };

      const result = await resolveTextInsight(
        'Project status',
        config,
        'Some actual text here'
      );

      expect(result.proposed).toBe(null);
      expect(result.reasoning).toContain('No meaningful keywords found');
    });
  });

  describe('Configuration Parsing', () => {
    it('should parse valid text config', () => {
      const configJson = JSON.stringify({
        expect: 'project completed',
        caseSensitive: true,
        exactMatch: false,
        keywords: ['project', 'done']
      });

      const config = parseTextConfig(configJson);

      expect(config.expect).toBe('project completed');
      expect(config.caseSensitive).toBe(true);
      expect(config.exactMatch).toBe(false);
      expect(config.keywords).toEqual(['project', 'done']);
    });

    it('should handle alternative field names', () => {
      const configJson = JSON.stringify({
        text: 'project completed',
        expectedText: 'fallback text'
      });

      const config = parseTextConfig(configJson);

      expect(config.expect).toBe('project completed'); // 'text' takes precedence
    });

    it('should use defaults for missing fields', () => {
      const configJson = JSON.stringify({
        expect: 'test'
      });

      const config = parseTextConfig(configJson);

      expect(config.caseSensitive).toBe(false);
      expect(config.exactMatch).toBe(false);
      expect(config.keywords).toBeUndefined();
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseTextConfig('invalid json')).toThrow('Invalid text resolver configuration');
    });
  });

  describe('Simple Text Match Helper', () => {
    it('should perform exact matching', () => {
      const result = simpleTextMatch('hello world', 'hello world', true);

      expect(result.matches).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.reasoning).toBe('Exact match');
    });

    it('should perform substring matching', () => {
      const result = simpleTextMatch('hello', 'hello world', false);

      expect(result.matches).toBe(true);
      expect(result.confidence).toBe(0.95);
      expect(result.reasoning).toBe('Substring match found');
    });

    it('should perform keyword matching', () => {
      const result = simpleTextMatch('project completed', 'the project was completed successfully', false);

      expect(result.matches).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasoning).toContain('Keyword match');
    });

    it('should return no match for unrelated text', () => {
      const result = simpleTextMatch('project completed', 'weather is nice today', false);

      expect(result.matches).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.reasoning).toBe('No significant matches found');
    });
  });
});
