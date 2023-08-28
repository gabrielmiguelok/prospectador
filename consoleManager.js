const readline = require('readline');

module.exports = {
    printConversation: function(conversation, number) {
        readline.moveCursor(process.stdout, 0, -conversation.lineCount);
        readline.clearScreenDown(process.stdout);
        console.log(`\n-----------------\nConversación ID: ${conversation.id} (Cuenta: ${conversation.clientNumber}, Cuenta Receptora: ${number})`);
        conversation.messages.forEach(msg => console.log(`${msg.direction}: ${msg.content}`));
        console.log('-----------------\n');
    },
    printError: function(error) {
        console.error(`Error al procesar el mensaje: ${error}`);
    },
    printEventError: function(err) {
        console.error('Error en el evento de mensaje: ', err);
    },
    printClientDelay: function(clientIndex) {
        console.log(`Cliente ${clientIndex + 1} ha enviado 20 mensajes. Esperando 20 minutos antes de enviar más mensajes.`);
    }
};
