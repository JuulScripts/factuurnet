const { connectDB } = require('../Modules/DB_handler');
const { createSHA256 } = require('../Modules/Hashing');
const { validateSessionToken, testRestrictionLevel } = require('../Modules/miscFunctions');
const { decrypt } = require('../Modules/Encryption');
const { table } = require('pdfkit');

const dbi = "invoicewebsite";

let allowedDbs = {
    subscriptions: "subscriptions",
    invoices: "invoices"
  
}

async function idController(req, res) {

    let {sessiontoken} = req.body
    let {id, db}= req.query
    let connection;
    
    try {
        connection = await connectDB(dbi);

  let tableName = allowedDbs[db]; // safely pick table from allowed list
if (tableName === null) {
            return res.status(401).json({ success: false, message: 'table doesnt exist' });

}
let [rows] = await connection.execute(
    `SELECT * FROM \`${tableName}\` WHERE id = ?`,
    [id]
);
console.log(rows)
        if (rows.length <= 0) {
            return res.status(401).json({ success: false, message: 'no data found' });
        }
            return res.status(200).json({ success: true, message: 'Data found', data: rows[0] });


    } catch (err) {
        console.log("database error" + err);
        return res.status(400).json({ success: false, message: 'database error' });
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

let allowedAlter = {
 status: "status"
}


async function changeIdController(req, res) {

    let {sessiontoken} = req.body
    let {id, db, alterid, newValue}= req.query
    let connection;
    
    try {
        connection = await connectDB(dbi);
        let tableName = allowedDbs[db]; // safely pick table from allowed list
        let alterTrue = allowedAlter[alterid]; // safely pick table from allowed list
        if (tableName == null ||  alterTrue == null) {
            return res.status(400).json({ success: false, message: 'table doesnt exist' });
        }


          let [rows] = await connection.execute(
           `UPDATE ${tableName} SET ${alterTrue} = '${newValue}' WHERE id = ?`,
            [id]
            );
           if (rows.length <= 0) {
            return res.status(401).json({ success: false, message: 'no data found' });
           }
            return res.status(200).json({ success: true, message: 'Data found', data: rows[0] });



        } catch (err) {
           console.log("database error" + err);
           return res.status(400).json({ success: false, message: 'database error' });
        } finally {
        if (connection) {
            connection.end();
        }
    }
}


module.exports = { idController, changeIdController };