// createProduct.js
const { connectDB } = require('../Modules/DB_handler');
const { validateSessionToken } = require('../Modules/miscFunctions');
const db = "invoicewebsite";

// Super simple delete helper
async function buildQuery(type, what, connection, misc) {
    let rows;
     
    switch(type) {
        case "invoiceId": 
        /*      [rows] = await connection.execute(
                 `DELETE invoices, invoice_products
FROM invoices
LEFT JOIN invoice_products
    ON invoice_products.invoice_id = invoices.id
WHERE invoices.id = ?;`,
                [misc]
            );*/
          [rows] = await connection.execute(
                 `DELETE FROM invoices WHERE id = ?;`,
                [misc]
            );
        break;
        case "id":
            [rows] = await connection.execute(
                `DELETE FROM ${what} WHERE id = ?`,
                [misc]
            );
            break;
     case "Cid":
        //delete inovices, have it on top incase this fails the user can just delete te customer itself.
      
             await connection.execute(
                `DELETE invoices, invoice_products
FROM invoices
LEFT JOIN invoice_products 
    ON invoice_products.invoice_id = invoices.id
WHERE invoices.customer_id = ?`,
                [misc]
            );
            [rows] = await connection.execute(
                `DELETE FROM ${what} WHERE customer_id = ?`,
                [misc]
            );
            
            break;
        case "name":
            [rows] = await connection.execute(
                `DELETE FROM ${what} WHERE name = ?`,
                [misc]
            );
            break;

        case "custom":
            // misc can be any test value for now
            [rows] = await connection.execute(
                `DELETE FROM ${what} WHERE some_field = ?`,
                [misc]
            );
            break;

        default:
            throw new Error("Unknown type");
    }

    return rows; // use rows.affectedRows in createProduct
}

// Main endpoint
async function deleteItem(req, res) {
    const {  sessiontoken} = req.body;
    const {type, what, misc} = req.query
    let connection;

    try {
        connection = await connectDB(db);

        const { valid } = await validateSessionToken(sessiontoken);
        if (!valid || !sessiontoken) {
            return res.status(400).json({ success: false, message: "Invalid session token" });
        }

        const rows = await buildQuery(type, what, connection, misc);

        if (rows.affectedRows > 0) {
            res.json({ success: true, deleted: rows.affectedRows });
        } else {
            res.status(400).json({ success: false, message: "No rows deleted" });
        }

    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        if (connection) connection.end();
    }
}

module.exports = { deleteItem };
