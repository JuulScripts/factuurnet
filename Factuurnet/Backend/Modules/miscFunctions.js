const { connectDB } = require("./DB_handler");
const { createSHA256 } = require("./Hashing");

let db = "invoicewebsite"

async function validateSessionToken(sessiontoken) {
  const connection = await connectDB(db);

  if (!sessiontoken) {
    return { valid: false, user_id: null }; 
  }

  let hashedSesh = createSHA256(sessiontoken);

  let [rows] = await connection.execute(
    "SELECT * FROM sessions WHERE token = ?",
    [hashedSesh]
  );

  if (rows.length > 0) {
    return { valid: true, user_id: rows[0].user_id };
  }

  return { valid: false, user_id: null };    
}
 


module.exports = { validateSessionToken }