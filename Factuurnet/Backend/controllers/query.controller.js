const { connectDB } = require('../Modules/DB_handler');
const { validateSessionToken } = require('../Modules/miscFunctions');
const { decrypt } = require('../Modules/Encryption');
  const whitelist = ["127.0.0.1", "::1"]; // add your allowed IPs
const db = "invoicewebsite";

// /send
async function sendController(req, res) {
  const data = req.body;
  const sessiontoken = data.sessiontoken;
  const query = data.query;
  const toggle = data.toggle;
  let connection;

  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip;

  if (!whitelist.includes(clientIp)) {
    return res
      .status(403)
      .json({ success: false, message: "Access denied: IP not whitelisted" });
  }

  try {
    connection = await connectDB(db);

    // TODO: restriction level check here
    if (sessiontoken == null) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }

    let { valid, user_id } = await validateSessionToken(sessiontoken);

    if (valid == false) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }

    const [rows, fields] = await connection.execute(query);

    let sqlresponse;
    let responseData;

    if (Array.isArray(rows)) {
      // SELECT query
      if (rows.length === 0) {
        sqlresponse =
          "OK — 0 rows returned. Check your query syntax; you may need to enclose string values in quotes in the WHERE clause.";
        responseData = [];
      } else {
        sqlresponse = `SELECT query executed, ${rows.length} rows returned`;

        if (toggle == "off") {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            for (const key in row) {
              if (typeof row[key] === "string" && row[key].includes(":::")) {
                row[key] = decrypt(row[key]);
              }
            }
          }
        }
        responseData = rows;
      }
    } else {
      // Non-SELECT query (INSERT, UPDATE, DELETE)
      const okPacket = rows; // `rows` here is actually the OK packet
      sqlresponse = `Query OK, ${okPacket.affectedRows} rows affected`;
      responseData = okPacket;
    }

    return res.status(200).json({
      success: true,
      message: "success",
      sqlresponse,
      data: responseData,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error: " + err });
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

module.exports = { sendController };
