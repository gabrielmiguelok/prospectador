const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    saveMediaMessage: async function(msg) {
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
};
