const fs = require('fs');
const readline = require('readline');

module.exports = async function leerNumeros(filePath = 'numbers.txt', suffix = '@c.us') {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    let numbers = [];
    for await (const line of rl) {
        numbers.push(line.trim() + suffix);
    }
    return numbers;
}

