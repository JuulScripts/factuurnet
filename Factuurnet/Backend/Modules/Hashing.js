const argon2 = require('argon2')
const crypto = require("crypto")


async function createArgon2(value) {    
  return await argon2.hash(value, {
    type: argon2.argon2id, // best general-purpose variant
    memoryCost: 2 ** 16,   // 64MB  
    timeCost: 3,    
    parallelism: 1, 
  });   
}   


    
async function validateArgon2(hash, plainValue) {
  try {
    return await argon2.verify(hash, plainValue);
  } catch {
    return false;
  }
}


 function createSHA256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

 function validateSHA256(hash, plainValue) {
  const computedHash = createSHA256(plainValue);
  return computedHash === hash;
}

 function createSessionToken() {
  return crypto.randomBytes(32).toString("hex"); // 64-character token
}




module.exports = {createArgon2, validateArgon2, createSHA256, validateSHA256, createSessionToken}