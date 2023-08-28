const fs = require('fs');  // Asegurarse de que fs esté importado
const delay = require('delay');
const { MessageMedia } = require('whatsapp-web.js');
const consoleManager = require('./consoleManager');
const excelManager = require('./excelManager');
const mediaManager = require('./mediaManager');

let counter = 1;
let conversations = new Map();
let messageCounters = [];

module.exports = {
    escucharMensajes: function(clients) {
        for (let i = 0; i < clients.length; i++) {
            messageCounters[i] = 0;
            const myNumber = clients[i].info.wid.user;
            clients[i].on('message', async (msg) => {
                try {
                    if (msg.type !== 'status') {
                        if (msg.type === 'chat') {
                            let number = msg.from.split('@')[0];
                            if (!conversations.has(number)) {
                                conversations.set(number, { id: counter++, clientIndex: i, clientNumber: myNumber, messages: [], lineCount: 0 });
                            }
                            let conversation = conversations.get(number);
                            conversation.messages.push({ direction: 'Recibido', content: msg.body });
                            consoleManager.printConversation(conversation, number);
                            await excelManager.exportToExcel(number, msg.body);
                        } else if (msg.hasMedia) {
                            await mediaManager.saveMediaMessage(msg);
                        }
                    }
                } catch (error) {
                    consoleManager.printError(error);
                }
            }).on('error', (err) => {
                consoleManager.printEventError(err);
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
            consoleManager.printConversation(conversation, numberObj.number);
            if(messageCounters[clientIndex] % 3 === 0) {
                consoleManager.printClientDelay(clientIndex);
                await delay(5 * 60 * 1000);
            }
            clientIndex = (clientIndex + 1) % clients.length;

            await excelManager.exportToExcel(numberObj.number, message);
        }
    }
};
