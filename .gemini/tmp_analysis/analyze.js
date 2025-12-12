const XLSX = require('xlsx');

const filePath = '/Users/ilariopc/Code/react/pwa-antigravity/lista_operazioni_11122025.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON to see the structure
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('Sheet Name:', sheetName);
    console.log('Total Rows:', data.length);
    console.log('First 50 rows (condensed):');

    data.slice(0, 50).forEach((row, index) => {
        if (row.length > 0) {
            console.log(`Row ${index}:`, JSON.stringify(row));
        }
    });

} catch (e) {
    console.error('Error reading file:', e);
}
