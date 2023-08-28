const fs = require('fs');
const readline = require('readline');

module.exports = async function leerNumeros() {
    const fileStream = fs.createReadStream('numbers.txt');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    let numbers = [];
    for await (const line of rl) {
        numbers.push(line.trim() + '@c.us');
    }
    return numbers;
}
