const readline = require('readline');
const delay = require('delay');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

let counter = 1;
let conversations = new Map();
let messageCounters = [];

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Mensajes');

worksheet.columns = [
    { header: 'Número', key: 'number' },
    { header: 'Mensaje', key: 'message' },
    { header: 'Fecha y Hora', key: 'date' }
];

async function exportToExcel(number, message) {
    const now = Date.now();
    const date = (now / 1000 / 60 / 60 / 24) + 25569;  
    worksheet.addRow({ number, message, date });
    await workbook.xlsx.writeFile('messages.xlsx');
}

async function saveMediaMessage(msg) {
    const number = msg.from.split('@')[0];
    const mediaMessageDir = path.join(__dirname, number.replace(/\D/g,''));

    if (!fs.existsSync(mediaMessageDir)){
        fs.mkdirSync(mediaMessageDir);
    }

    const filesInDirectory = fs.readdirSync(mediaMessageDir);
    const nextFileNumber = ('00' + (filesInDirectory.length + 1)).slice(-3);

    const mediaData = await msg.downloadMedia();
    if(mediaData) {
        const fileName = path.join(mediaMessageDir, `${nextFileNumber}.${mediaData.mimetype.split('/')[1]}`);
        fs.writeFileSync(fileName, mediaData.data, 'base64');
    }
}

module.exports = {
    escucharMensajes: function(clients) {
        for (let i = 0; i < clients.length; i++) {
            messageCounters[i] = 0;
            const myNumber = clients[i].info.wid.user;
            clients[i].on('message', async (msg) => {
                try {
                    if (msg.type !== 'status') {  // This condition ensures we skip status media
                        if (msg.type === 'chat') {
                            let number = msg.from.split('@')[0];
                            if (!conversations.has(number)) {
                                conversations.set(number, { id: counter++, clientIndex: i, clientNumber: myNumber, messages: [], lineCount: 0 });
                            }
                            let conversation = conversations.get(number);
                            conversation.messages.push({ direction: 'Recibido', content: msg.body });
                            readline.moveCursor(process.stdout, 0, -conversation.lineCount);
                            readline.clearScreenDown(process.stdout);
                            console.log(`\n-----------------\nConversación ID: ${conversation.id} (Cuenta: ${conversation.clientNumber}, Cuenta Receptora: ${number})`);
                            conversation.messages.forEach(msg => console.log(`${msg.direction}: ${msg.content}`));
                            console.log('-----------------\n');
                            conversation.lineCount = conversation.messages.length + 3;
                        
                            await exportToExcel(number, msg.body);
                        } else if (msg.hasMedia) {
                            await saveMediaMessage(msg);
                        }
                    }
                } catch (error) {
                    console.error(`Error al procesar el mensaje: ${error}`);
                }
            }).on('error', (err) => {
                console.error('Error en el evento de mensaje: ', err);
            });
        }
        return conversations;
    },
    enviarMensajes: async function(clients, numbers, message) {
        let clientIndex = 0;
        let images = fs.readdirSync('./').filter(file => ['.jpg', '.jpeg', '.png'].includes(path.extname(file)));
        let imageIndex = 0;
        let hasImages = images.length > 0;

        for(let numberObj of numbers) {
            let client = clients[clientIndex];
            client.sendMessage(numberObj.number + '@c.us', message);
            messageCounters[clientIndex]++;
            await delay(4000);

            if(hasImages){
                const media = MessageMedia.fromFilePath('./' + images[imageIndex]);
                client.sendMessage(numberObj.number + '@c.us', media);
                messageCounters[clientIndex]++;
                await delay(4000);

                imageIndex = (imageIndex + 1) % images.length;
            }

            let conversation = conversations.get(numberObj.number);
            if (!conversation) {
                const myNumber = client.info.wid.user;
                conversation = { id: counter++, clientIndex: clientIndex, clientNumber: myNumber, messages: [], lineCount: 0 };
                conversations.set(numberObj.number, conversation);
            }
            conversation.messages.push({ direction: 'Enviado', content: message });
            readline.moveCursor(process.stdout, 0, -conversation.lineCount);
            readline.clearScreenDown(process.stdout);
            console.log(`\n-----------------\nConversación ID: ${conversation.id} (Cuenta: ${conversation.clientNumber}, Cuenta Receptora: ${numberObj.number})`);
            conversation.messages.forEach(msg => console.log(`${msg.direction}: ${msg.content}`));
            console.log('-----------------\n');
            conversation.lineCount = conversation.messages.length + 3;
            if(messageCounters[clientIndex] % 20 === 0) {
                console.log(`Cliente ${clientIndex + 1} ha enviado 20 mensajes. Esperando 20 minutos antes de enviar más mensajes.`);
                await delay(20 * 60 * 1000);
            }
            clientIndex = (clientIndex + 1) % clients.length;

            await exportToExcel(numberObj.number, message);
        }
    }
};
