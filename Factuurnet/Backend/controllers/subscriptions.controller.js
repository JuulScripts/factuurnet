const { connectDB } = require('../Modules/DB_handler');
const { validateSessionToken, testRestrictionLevel } = require('../Modules/miscFunctions');
const db = "invoicewebsite";

// /fetchsubscriptions
async function fetchSubscriptionsController(req, res) {
  let connection;
  let { sessiontoken, page, id} = req.body;
const limit = 50; 
const amount = page * limit - limit; 

  try {
    connection = await connectDB(db);

    let { valid, user_id } = await validateSessionToken(sessiontoken);

    if (valid == false) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }


let [rows] = await connection.execute(
  "SELECT id, name, user_id, price, subscription_length, periodes, start_date, amount FROM subscriptions WHERE user_id = ? LIMIT ?, ?",
  [id,amount, limit]
);


    if (rows.length <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "No data found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "succes", data: rows });

  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Database error" });
  }
}

// /addsubscription
async function addSubscriptionController(req, res) {
  let connection;
  let { sessiontoken, name, subscription_length, periodes } = req.body;
  let id = req.query.id;

  try {
    connection = await connectDB(db);

    let { valid, user_id } = await validateSessionToken(sessiontoken);

    if (valid == false) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }


    let [rows] = await connection.execute(
      "INSERT INTO subscriptions (name, subscription_length,  periodes, user_id) VALUES (?,?,?,?)",
      [name, subscription_length, periodes, id]
    );

    if (rows.length <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "No data found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "succes", data: rows[0] });

  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Database error" });
  }
}
async function setAutoSend(req, res) {
  let { id } = req.body;
  let connection;

  try {
    connection = await connectDB(db);

    let [rows] = await connection.execute(
      "UPDATE subscriptions SET auto_send = true WHERE id = ?",
      [id]
    );

    if (rows.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong during updating autosend",
      });
    }

    return res.json({
      success: true,
      message: "Auto send enabled",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    if (connection) await connection.end();
  }
}




async function unsetAutoSend(req, res) {
  let { id } = req.body;
  let connection;

  try {
    connection = await connectDB(db);

    let [rows] = await connection.execute(
      "UPDATE subscriptions SET auto_send = false WHERE id = ?",
      [id]
    );

    if (rows.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong during updating autosend",
      });
    }

    return res.json({
      success: true,
      message: "Auto send disabled",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    if (connection) await connection.end();
  }
}


async function getAutoSend(req, res) {
  let  id = req.query.id;
  let connection;

  try {
    connection = await connectDB(db);

    let [rows] = await connection.execute(
      "SELECT auto_send FROM subscriptions WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.json({
      success: true,
      auto_send: rows[0].auto_send,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = {getAutoSend,setAutoSend, unsetAutoSend, fetchSubscriptionsController,addSubscriptionController };
