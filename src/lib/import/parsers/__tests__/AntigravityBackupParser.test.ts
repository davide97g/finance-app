import { AntigravityBackupParser } from '../AntigravityBackupParser';

describe('AntigravityBackupParser', () => {
    let parser: AntigravityBackupParser;

    beforeEach(() => {
        parser = new AntigravityBackupParser();
    });

    describe('canParse', () => {
        it('should accept valid backup JSON with transactions', async () => {
            const json = JSON.stringify({ transactions: [], categories: [] });
            const file = new File([json], 'backup.json', { type: 'application/json' });
            expect(await parser.canParse(file, json)).toBe(true);
        });

        it('should reject legacy vue export', async () => {
            const json = JSON.stringify({ source: 'vue-firebase-expense-tracker', data: {} });
            const file = new File([json], 'legacy.json', { type: 'application/json' });
            expect(await parser.canParse(file, json)).toBe(false);
        });

        it('should reject invalid json', async () => {
            const json = '{ invalid: ';
            const file = new File([json], 'bad.json', { type: 'application/json' });
            expect(await parser.canParse(file, json)).toBe(false);
        });
    });

    describe('parse', () => {
        it('should correctly parsing transactions and entities', async () => {
            const data = {
                transactions: [
                    { id: 'tx1', date: '2023-01-01', amount: -10, description: 'Test', type: 'expense' }
                ],
                categories: [{ id: 'cat1', name: 'Food' }],
                contexts: [{ id: 'ctx1', name: 'Personal' }]
            };
            const json = JSON.stringify(data);
            const file = new File([json], 'backup.json');

            const result = await parser.parse(file, json);

            expect(result.transactions).toHaveLength(1);
            expect(result.transactions[0].id).toBe('tx1');
            expect(result.transactions[0].amount).toBe(-10);

            expect(result.categories).toHaveLength(1);
            expect(result.contexts).toHaveLength(1);
            expect(result.source).toBe('antigravity_backup');
        });

        it('should parse string amounts if necessary', async () => {
            const data = {
                transactions: [
                    { id: 'tx1', amount: "-10.50" }
                ]
            };
            const json = JSON.stringify(data);
            const file = new File([json], 'backup.json');

            const result = await parser.parse(file, json);
            expect(result.transactions[0].amount).toBe(-10.50);
        });
    });
});
