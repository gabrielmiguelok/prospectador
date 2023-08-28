const ExcelJS = require('exceljs');

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Mensajes');

worksheet.columns = [
    { header: 'Número', key: 'number' },
    { header: 'Mensaje', key: 'message' },
    { header: 'Fecha y Hora', key: 'date' }
];

module.exports = {
    exportToExcel: async function(number, message) {
        const now = Date.now();
        const date = (now / 1000 / 60 / 60 / 24) + 25569;  
        worksheet.addRow({ number, message, date });
        await workbook.xlsx.writeFile('messages.xlsx');
    }
};
