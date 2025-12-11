import { levenshteinDistance, findBestMatch, normalizeString } from '../stringUtils';

describe('stringUtils', () => {
    describe('normalizeString', () => {
        it('should lowercase and trim strings', () => {
            expect(normalizeString('  TEST  ')).toBe('test');
        });

        it('should normalize internal whitespace', () => {
            expect(normalizeString('foo   bar')).toBe('foo bar');
        });
    });

    describe('levenshteinDistance', () => {
        it('should calculate distance correctly', () => {
            expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
            expect(levenshteinDistance('Saturday', 'Sunday')).toBe(3);
        });

        it('should return 0 for identical strings', () => {
            expect(levenshteinDistance('test', 'test')).toBe(0);
        });

        it('should return length of string compared to empty', () => {
            expect(levenshteinDistance('test', '')).toBe(4);
            expect(levenshteinDistance('', 'test')).toBe(4);
        });

        it('should be case sensitive', () => {
            // function assumes inputs are case-sensitive, caller usually normalizes
            expect(levenshteinDistance('Test', 'test')).toBe(1);
        });
    });

    describe('findBestMatch', () => {
        const candidates = ['Apple', 'Banana', 'Orange', 'Pineapple'];

        it('should find exact match', () => {
            const result = findBestMatch('Apple', candidates);
            expect(result).toEqual({ match: 'Apple', distance: 0 });
        });

        it('should find close match', () => {
            const result = findBestMatch('Aplle', candidates);
            expect(result?.match).toBe('Apple');
            expect(result?.distance).toBe(1);
        });

        it('should return null if no match within threshold', () => {
            // 'Zebra' distance to 'Banana' is huge
            const result = findBestMatch('Zebra', candidates);
            expect(result).toBeNull();
        });

        it('should respect custom threshold', () => {
            // 'Pineaple' (dist 1) vs 'Pineapple'
            // 'Pine' vs 'Pineapple' (dist 5)
            const result = findBestMatch('Pine', candidates, 1);
            expect(result).toBeNull();

            const result2 = findBestMatch('Pineaple', candidates, 1);
            expect(result2?.match).toBe('Pineapple');
        });
    });
});
