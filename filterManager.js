const consoleManager = require('./consoleManager');
const excelManager = require('./excelManager');
const mediaManager = require('./mediaManager');

module.exports = {
    processChatMessage: async function(msg, number, conversation) {
        conversation.messages.push({ direction: 'Recibido', content: msg.body });
        consoleManager.printConversation(conversation, number);
        await excelManager.exportToExcel(number, msg.body);
    },

    processMediaMessage: async function(msg) {
        await mediaManager.saveMediaMessage(msg);
    }
};
