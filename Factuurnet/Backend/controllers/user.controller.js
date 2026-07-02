const { connectDB } = require('../Modules/DB_handler');
const { encrypt, decrypt} = require('../Modules/Encryption');
const { createArgon2, createSHA256 } = require('../Modules/Hashing');
const { testRestrictionLevel, validateSessionToken } = require('../Modules/miscFunctions');

const db = "invoicewebsite";
//createuser
async function registerController(req, res) {
    let connection;
    let {username, password, email, sessiontoken} = req.body;
    email = encrypt(email);
    password = await createArgon2(password);

 let { valid, user_id } = await validateSessionToken(sessiontoken);
    if ( sessiontoken == null ||valid == false ) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }
    try {
        connection = await connectDB(db);
        await connection.execute(
            "INSERT INTO users (username, password, email) VALUES ( ?, ?, ?)",
            [username, password, email]
        );
        return res.status(200).json({ success: true });
    } catch (err) {
        console.log("database error " + err);
        return res.send("database error");
    } finally {
        if (connection) {
            connection.end();
        }
    }
}
async function getUsers(req, res) {
    let connection;
    let {sessiontoken} = req.body;
    try {
        connection = await connectDB(db);
      const [rows] = await connection.execute(
  "SELECT id, username, email FROM users"
);
        if (rows === 0) {
        return res.status(400).json({ success: false, message: "no users found" });
        }

rows.forEach(row => {
    if (row.email) {
    row.email = decrypt(row.email);
    }
});
        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.log("database error " + err);
        return res.send("database error");
    } finally {
        if (connection) {
            connection.end();
        }
    }
}
module.exports = { registerController, getUsers };
