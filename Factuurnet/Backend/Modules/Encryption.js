const crypto = require("crypto")
require('dotenv').config();

if (!process.env.AES_SECRET) {
    throw new Error("AES_SECRET is not defined in your .env file");
}



const algorithm = 'aes-256-cbc'; // AES encryption
const key = crypto.scryptSync(process.env.AES_SECRET, 'salt', 32);

const ivLength = 16; // AES block size


// Encrypt
function encrypt(text) {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    // Store IV + encrypted data together
    return iv.toString('hex') + ':::' + encrypted.toString('hex');
}

// Decrypt
function decrypt(encryptedText) {
    const [ivHex, dataHex] = encryptedText.split(':::');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedData = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };