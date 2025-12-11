import { RevolutParser } from '../RevolutParser';


describe('RevolutParser', () => {
    let parser: RevolutParser;

    beforeEach(() => {
        parser = new RevolutParser();
    });

    describe('canParse', () => {
        it('should return true for valid English headers', async () => {
            const csv = 'Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance';
            const file = new File([csv], 'revolut_en.csv', { type: 'text/csv' });
            expect(await parser.canParse(file, csv)).toBe(true);
        });

        it('should return true for valid Italian headers', async () => {
            const csv = 'Tipo,Prodotto,Data di inizio,Data di completamento,Descrizione,Importo,Costo,Valuta,Stato,Saldo';
            const file = new File([csv], 'revolut_it.csv', { type: 'text/csv' });
            expect(await parser.canParse(file, csv)).toBe(true);
        });

        it('should return false for unrelated csv content', async () => {
            const csv = 'Date,Payee,Memo,Amount';
            const file = new File([csv], 'other.csv', { type: 'text/csv' });
            expect(await parser.canParse(file, csv)).toBe(false);
        });
    });

    describe('parse', () => {
        it('should parse valid English transactions correctly', async () => {
            const csv = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
CARD_PAYMENT,Current,2025-05-10 10:00:00,2025-05-10 10:00:00,Supermarket,-50.00,0.00,EUR,COMPLETED,1000.00
TOPUP,Current,2025-05-11 09:00:00,2025-05-11 09:00:00,Top Up,200.00,0.00,EUR,COMPLETED,1200.00`;

            const file = new File([csv], 'test.csv');
            const result = await parser.parse(file, csv);

            expect(result.transactions).toHaveLength(2);

            const tx1 = result.transactions[0];
            expect(tx1.description).toBe('Supermarket');
            expect(tx1.amount).toBe(50.00);
            expect(tx1.type).toBe('expense');
            expect(tx1.date).toBe('2025-05-10');

            const tx2 = result.transactions[1];
            expect(tx2.description).toBe('Top Up');
            expect(tx2.amount).toBe(200.00);
            expect(tx2.type).toBe('income');
            expect(tx2.date).toBe('2025-05-11');
        });

        it('should parse valid Italian transactions correctly', async () => {
            const csv = `Tipo,Prodotto,Data di inizio,Data di completamento,Descrizione,Importo,Costo,Valuta,Stato,Saldo
PAGAMENTO,Attuale,2025-12-01 12:30:00,2025-12-01 12:30:00,Ristorante,-35.50,0.00,EUR,COMPLETATO,500.00`;

            const file = new File([csv], 'test_it.csv');
            const result = await parser.parse(file, csv);

            expect(result.transactions).toHaveLength(1);
            expect(result.transactions[0].description).toBe('Ristorante');
            expect(result.transactions[0].amount).toBe(35.50);
            expect(result.transactions[0].type).toBe('expense');
            // The parser logic replaces space with T for ISO conversion
            expect(result.transactions[0].date).toBe('2025-12-01');
        });

        it('should filter out non-completed transactions', async () => {
            const csv = `Type,Product,Completed Date,Description,Amount,State,Balance
CARD_PAYMENT,Current,2025-05-10,Pending Tx,-10.00,PENDING,100.00
CARD_PAYMENT,Current,2025-05-10,Reverted Tx,-10.00,REVERTED,100.00
CARD_PAYMENT,Current,2025-05-10,Completed Tx,-10.00,COMPLETED,90.00`;

            const file = new File([csv], 'test.csv');
            const result = await parser.parse(file, csv);

            expect(result.transactions).toHaveLength(1);
            expect(result.transactions[0].description).toBe('Completed Tx');
        });

        it('should filter savings accounts if option is not enabled', async () => {
            const csv = `Type,Product,Completed Date,Description,Amount,State,Balance
CARD_PAYMENT,Current,2025-05-10,Main Account,-10.00,COMPLETED,100.00
TRANSFER,Savings,2025-05-10,Savings Pot,-5.00,COMPLETED,500.00`;

            const file = new File([csv], 'test.csv');

            // Default behavior (no options) -> should define standard accounts check
            // The parser checks for 'ATTUALE', 'CURRENT', 'PERSONAL', 'MAIN'
            const result = await parser.parse(file, csv);

            expect(result.transactions).toHaveLength(1);
            expect(result.transactions[0].description).toBe('Main Account');
        });

        it('should include savings accounts if option is enabled', async () => {
            const csv = `Type,Product,Completed Date,Description,Amount,State,Balance
CARD_PAYMENT,Current,2025-05-10,Main Account,-10.00,COMPLETED,100.00
TRANSFER,Savings,2025-05-10,Savings Pot,-5.00,COMPLETED,500.00`;

            const file = new File([csv], 'test.csv');
            // Assuming the interface expects { includeSavings: true }
            const result = await parser.parse(file, csv, { includeSavings: true });

            expect(result.transactions).toHaveLength(2);
        });
    });
});
