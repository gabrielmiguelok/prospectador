// Incluye los módulos requeridos
const readline = require('readline');
const delay = require('delay');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const mensajeria = require('./mensajeria');
const leerNumeros = require('./leerNumeros');
const keypress = require('keypress');
const fs = require('fs');

// Crea una interfaz readline para la entrada y salida estándar
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Escucha los eventos de tecla
keypress(process.stdin);

let clients;
let conversations;

// Función para iniciar las cuentas de WhatsApp
async function iniciar(numAccounts) {
    numAccounts = parseInt(numAccounts);
    const clients = Array(numAccounts).fill().map(() => new Client({ qrTimeoutMs: 10000 }));
    for(let i = 0; i < numAccounts; i++) {
        const client = clients[i];
        client.on('qr', (qr) => {
            console.clear();
            console.log(`Por favor, escanea el QR code para el cliente ${i+1}.`);
            qrcode.generate(qr, { small: true });
        });
        client.on('ready', () => {
            console.log(`El cliente ${i+1} está listo!`);
        });
        client.initialize();
        await new Promise(resolve => {
            client.on('ready', resolve);
        });
    }
    return clients;
}

async function reiterarEnvio() {
    const numbers = await leerNumeros();
    let mensaje = fs.readFileSync('mensaje.txt', 'utf8');
    await mensajeria.enviarMensajes(clients, numbers.map(num => ({ number: num.split('@')[0], clientIndex: 0 })), mensaje);
}

// Función principal del programa
async function main() {
    try {
        rl.question('¿Cuántas cuentas de WhatsApp desea utilizar? ', async (numAccounts) => {
            try {
                clients = await iniciar(numAccounts);
                conversations = mensajeria.escucharMensajes(clients);
                const numbers = await leerNumeros();

                // Leer el mensaje de un archivo
                let mensaje;
                try {
                    mensaje = fs.readFileSync('mensaje.txt', 'utf8');
                    console.log(`El mensaje será: "${mensaje}"`);
                } catch (error) {
                    console.log('No se pudo leer el mensaje del archivo "mensaje.txt". No se enviará ningún mensaje de texto.');
                }

                // Leer la imagen de un archivo
                let imageBuffer = null;
                try {
                    imageBuffer = fs.readFileSync('imagen.jpg');
                } catch (error) {
                    console.log('No se pudo leer la imagen del archivo "imagen.jpg". No se enviará ninguna imagen.');
                }

                await mensajeria.enviarMensajes(clients, numbers.map(num => ({ number: num.split('@')[0], clientIndex: 0 })), mensaje, imageBuffer);
            } catch (error) {
                console.error('Error en la inicialización: ', error);
            }
        });
    } catch (error) {
        console.error('Error en la función main: ', error);
    }
}

// Inicia la función principal
main();

// Manejo de eventos de teclado
process.stdin.on('keypress', function(ch, key) {
    try {
        if (key && key.ctrl && key.name == 'c') {
            process.exit();
        } else if (key && key.name == 'r') { // Suponiendo que 'r' es la tecla que desencadenará la reiteración del envío
            reiterarEnvio();
        } else if (key && key.name == '¿') {
            rl.question('Escribe los IDs de las conversaciones a las que deseas enviar un segundo mensaje: ', async (ids) => {
                try {
                    const secondNumbers = ids.split(',').map(id => {
                        let number = Array.from(conversations.keys())[parseInt(id)-1];
                        if (conversations.has(number)) {
                            let clientIndex = conversations.get(number).clientIndex;
                            return { number: number.split('@')[0], clientIndex: clientIndex };
                        } else {
                            console.log(`El número ${number} no existe en las conversaciones.`);
                            return null;
                        }
                    }).filter(numberObj => numberObj != null);

                    if (secondNumbers.length > 0) {
                        rl.question('¿Cuál es el mensaje que deseas enviar en respuesta? ', async (mensaje) => {
                            try {
                                await mensajeria.enviarMensajes(clients, secondNumbers, mensaje);
                            } catch (error) {
                                console.error('Error al enviar mensajes en respuesta: ', error);
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error al procesar las IDs de las conversaciones: ', error);
                }
            });
        }
    } catch (error) {
        console.error('Error en el manejo de teclas: ', error);
    }
});

// Pone el proceso de entrada en modo raw y lo reanuda
process.stdin.setRawMode(true);
process.stdin.resume();
