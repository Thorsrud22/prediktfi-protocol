import { describe, it, expect } from 'vitest';
import { ideaSubmissionSchema } from '../../src/lib/ideaSchema';

describe('ideaSubmissionSchema', () => {
    it('accepts nft, gaming, and other project types', () => {
        const basePayload = {
            description: 'Valid project description',
            teamSize: 'solo',
            responseStyle: 'balanced'
        };

        const supportedTypes = ['nft', 'gaming', 'other'] as const;
        for (const projectType of supportedTypes) {
            const parsed = ideaSubmissionSchema.safeParse({ ...basePayload, projectType });
            expect(parsed.success).toBe(true);
        }
    });

    it('preserves name when provided', () => {
        const parsed = ideaSubmissionSchema.safeParse({
            description: 'Valid project description',
            projectType: 'memecoin',
            name: 'PROJECTX'
        });

        expect(parsed.success).toBe(true);
        if (!parsed.success) {
            return;
        }

        expect(parsed.data.name).toBe('PROJECTX');
    });

    it('rejects description with only spaces', () => {
        const parsed = ideaSubmissionSchema.safeParse({
            description: '          ',
            projectType: 'ai'
        });

        expect(parsed.success).toBe(false);
        if (parsed.success) {
            return;
        }

        expect(parsed.error.issues.some(issue => issue.path.join('.') === 'description')).toBe(true);
    });
});
