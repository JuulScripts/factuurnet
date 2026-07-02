const { connectDB } = require('../Modules/DB_handler');
const { createSHA256 } = require('../Modules/Hashing');
const { validateSessionToken } = require('../Modules/miscFunctions');
const { decrypt } = require('../Modules/Encryption');
const { x } = require('pdfkit');

const db = "invoicewebsite";
//fetchusers
async function dataFetchController(req, res) {
    let data;
    let username = req.body["username"];
    let sessiontoken = req.body["sessiontoken"];
    sessiontoken = createSHA256(sessiontoken);

    let connection;

    try {
        connection = await connectDB(db);

        let [rows] = await connection.execute(
            "SELECT * FROM sessions WHERE token = ?",
            [sessiontoken]
        );

        if (rows.length <= 0) {
            return res.status(401).json({ success: false, message: 'session token not found' });
        }

    } catch (err) {
        console.log("database error" + err);
        return res.status(400).json({ success: false, message: 'database error' });
    } finally {
        if (connection) {
            connection.end();
        }
    }

    return res.status(200).json({ success: true, message: 'data fetched', data: data });
}

//getuserdata
async function getUserDataController(req, res) {
    let connection;
  const { sessiontoken, page } = req.body;
const limit = 50; 
const amount = page * limit - limit; 

    try {
        connection = await connectDB(db);

        if (sessiontoken == null) {
            return res.status(400).json({ success: false, message: "no valid session token", invalidsesh: true });
        }

        let { valid, user_id } = await validateSessionToken(sessiontoken);
        if (valid == false) {
            return res.status(400).json({ success: false, message: "no valid session token", invalidsesh: true });
        }

     

        let [rows] = await connection.execute(
            "SELECT * FROM customers LIMIT ?, ?",
            [ amount, limit]
        );

        let data = [];

        rows.forEach((e) => {
            const decrypted = {
      email: e.email ? decrypt(e.email) : null,
phone: e.phonenumber ? decrypt(e.phonenumber) : null,
company_name: e.company_name ? decrypt(e.company_name) : null,
name: e.name ? decrypt(e.name) : null,
id: e.customer_id
            };
            data.push(decrypted);
        });

        return res.status(200).json({ success: true, message: 'data fetched', data: data });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'database error' });
    } finally {
        if (connection) {
            connection.end();
        }
    }
}
///data/invoicedata
async function invoiceDataController(req, res) {
    const id = req.query.invoiceid;
    const { sessiontoken } = req.body;
    let connection;

    try {
        connection = await connectDB(db);
        let { valid, user_id } = await validateSessionToken(sessiontoken);

        if (valid == false) {
            return res.status(400).json({ success: false, message: "no valid session token" });
        }


        let [rows] = await connection.execute(
            "SELECT * FROM invoices WHERE id = ?",
              [id]
        );



        if (rows.length <= 0  ) {
            return res.status(400).json({ success: false, message: 'no invoice found' });
        }

        rows[0].address = decrypt(rows[0].address);

        let [nameRows] = await connection.execute(
            "SELECT name FROM customers WHERE customer_id = ?",
            [rows[0].customer_id]
        );


        let [secondaryRows] = await connection.execute(
          'SELECT * FROM invoice_products WHERE invoice_id = ?',
          [id]
        )
// pass vat sepperatly for ease of use -> recieve vat (check if its null then do prodect else do sepperate)
        if (nameRows.length <= 0 || nameRows.length <= secondaryRows) {
            return res.status(400).json({ success: false, message: 'no name found' });
        }
        console.log(secondaryRows)
        return res.status(200).json({
            success: true,
            message: 'Data found',
            data: rows[0],
            name: decrypt(nameRows[0].name),
            productdata: secondaryRows
        });

    } catch (err) {
        console.log("data base error, error: " + err);
        return res.status(500).json({ success: false, message: 'database error' });
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

function safeDecrypt(value) {
  if (value === null || value === undefined) return null; // or "" if you prefer empty string
  return decrypt(value);
}
// /data/userprofile
async function userProfileController(req, res) { 
  let customer_id = req.query.userid;
  let connection;
  let { sessiontoken } = req.body;

  try {
    let { valid, user_id } = await validateSessionToken(sessiontoken);

    if (sessiontoken == null || valid == false) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }

    

    connection = await connectDB(db);

    let [rows] = await connection.execute(
      "SELECT * FROM customers WHERE customer_id = ?",
      [customer_id]
    );
    if (rows.length <= 0 ) {
      return res.status(400).json({ success: false, message: 'No user data found.' });  
    }



let unencryptedData = {
  customer_id: rows[0].customer_id ?? null,
  name: safeDecrypt(rows[0].name),
  email: safeDecrypt(rows[0].email),
  phonenumber: safeDecrypt(rows[0].phonenumber),
  address: safeDecrypt(rows[0].address),
  company_name: safeDecrypt(rows[0].company_name),
  chamber_of_commerce_number: safeDecrypt(rows[0].chamber_of_commerce_number),
  vat_number: safeDecrypt(rows[0].vat_number),
  peppol_id: rows[0].peppol_id || null,
  contact_person: rows[0].contact_person || null,
  postal_code_city: safeDecrypt(rows[0].postal_code_city),
  country: safeDecrypt(rows[0].country),
  mobile_number: safeDecrypt(rows[0].mobile_number),
  fax_number: safeDecrypt(rows[0].fax_number),
  website: rows[0].website || null,
  notes: safeDecrypt(rows[0].notes) || "",
  lastname: safeDecrypt(rows[0].lastname) || "",
  city: safeDecrypt(rows[0].city) || ""
};

    return res.status(200).json({ success: true, message: 'Succesfully found user data.', data: unencryptedData });  
  } catch (err) {
    console.log("an error occured in user profile error: " + err);
  } finally {
    if (connection) connection.end();
  }
}



// /data/debitor
async function debitorController(req, res) {
  const id = req.query.user;
  const { sessiontoken, page } = req.body;
  let connection;
const limit = 50; 
const amount = page * limit - limit; 

  try {
    connection = await connectDB(db);

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
 
    let [data] = await connection.execute(
      'SELECT name, company_name FROM customers WHERE customer_id = ?',
      [id]
    );

    if (data.length <= 0) {
      return res.status(400).json({ success: false, message: 'error' });
    }

let [rows] = await connection.execute(
  'SELECT * FROM invoices WHERE customer_id = ? LIMIT ?, ?',
  [id, amount, limit]
);


    if (rows.length <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'no invoices found', 
        name: decrypt(data[0].name)
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'success',  
      data: rows, 
      name: decrypt(data[0].name),
     company_name: data[0].company_name 
  ? decrypt(data[0].company_name) 
  : null
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: 'database error' });
  } finally {
    if (connection != null) {
      connection.end();
    }
  }
}


async function getInvoiceProducts(req, res) {
  const id = req.query.id;
  const { sessiontoken } = req.body;
  let connection
  try {
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
    console.log("ben")

    connection = await connectDB(db);

    let [data] = await connection.execute(
           `SELECT * FROM invoice_products WHERE subscription_id = ?`,
      [id]
    );
   console.log(data)
    if (data.length <= 0) {
      return res.status(400).json({ success: false, message: 'error' });
    }



    return res.status(200).json({ 
      success: true, 
      message: 'success',  
      data: data, 
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: 'database error' });
  } finally {
    if (connection != null) {
      connection.end();
    }




  }
}
 

async function createConceptInvoice(req, res) {
 let connection 
 const {sessiontoken, customer_id} = req.body
 console.log(sessiontoken)
 subscriptionid = req.query.subscriptionid
 try {
  connection = await connectDB(db)
 
let [invoiceRows] = await connection.execute(
    "SELECT user_id, adress, price, total, id FROM subscriptions WHERE id = ?",
    [subscriptionid]
  )

  
  if (invoiceRows.length === 0) {
    return res.status(400).json({ success: false, message: 'something went wrong whilst inserting new invoice'});
  }
const today = new Date();

const nextWeek = new Date();
nextWeek.setDate(today.getDate() + 7);
  let rowData = invoiceRows[0]
  const mappedArray = [
  rowData.user_id,
  rowData.adress,
  rowData.price,
  rowData.total,
  rowData.id,
  "Afwachting",
  false,
  today,
  nextWeek,
  today
];
  let [rows] = await connection.execute(
    "INSERT INTO invoices (customer_id, address, subtotal, total, subscription_id, status,  send_status, invoice_date, due_date, date) VALUES (?,?,?,?,?,?,?,?,?, ?)",
     mappedArray
  )

  if (rows.affectedRows <= 0) {
  return res.status(400).json({ success: false, message: 'something went wrong whilst inserting new invoice'});
  }
  const invoiceid = rows.insertId
  const data = await fetch(`http://localhost/data/invoiceproducts?id=${subscriptionid}`, {
    body: JSON.stringify({sessiontoken: sessiontoken}),
    method: "POST",
     headers: {
                "Content-Type": "application/json"
            },
  })

  const result = await data.json()
  const invoiceProducts = result.data
const values = invoiceProducts.map(product => [
  invoiceid,
  product.name,
  product.price,
  product.amount,
  product.vat_percentage
]);

  let [productInvoiceRows] = await connection.query(
       `INSERT INTO invoice_products
   (invoice_id, name, price, amount, vat_percentage)
   VALUES ?`,
  [values]
      )
  
  if (productInvoiceRows.affectedRows <= 0) {
  return res.status(400).json({ success: false, message: 'something went wrong whilst inserting new invoice products'});
  }
  
  return res.status(200).json({ success: false, message: 'something went wrong whilst inserting new invoice products'});
} catch (err) {
  console.log(err)
  return res.status(500).json({ success: false, message: 'something went wrong whilst inserting new invoice products'});

} finally {if (connection) connection.end()}
}



async function updateInvoiceProducts(req,res ) {
  let connection 
  let {data} = req.body
  let id = req.query.id
  try {
    connection = await connectDB(db); 
    
    data.forEach(async (e) => {
      console.log("data", e)
  let [rows] = await  connection.query(
    `UPDATE invoice_products
SET name = ?, price = ?, amount = ?, vat_percentage = ?
WHERE id = ?`,
e
    )

    if (rows.affectedRows === 0) {
  return res.status(400).json({ success: false, message: 'something went wrong whilst updating invoice products'});
    }
    })
  
     let total = 0;
     let subtotal = 0; 
     data.forEach((e) => {
      total += e[1]*e[2] * (e[3]/100 + 1)   // 1 price, 2 amount, 3 vat
      subtotal += e[1]*e[2]
     } 
     )
 console.log(total, subtotal, id)
     let [secondaryRows] = await connection.execute(
      "UPDATE invoices SET total = ?, subtotal = ? WHERE id = ?",
       [total, subtotal, id]
     )


     //update subscription aswell, do after subscription rework
  return res.status(200).json({ success: true, message: 'updated succesfully'});

  } catch (err) {
    console.log(err)
  return res.status(500).json({ success: false, message: 'database error'});

  } finally {
    if (connection) connection.end;
  }
}


let allowed = {
 customers: "customers" 
}

async function getPageLength(req, res) {
  let connection
  let selectDatabase = req.query.db
  
  if (!allowed[selectDatabase] || allowed[selectDatabase] == null)  return res.status(400).json({ success: false, message: 'Invalid database'});
  try {
  connection = await connectDB(db)
  
  let [rows] = await connection.execute(
     `SELECT * FROM ${allowed[selectDatabase]}` 
  )

  return res.status(200).json({ success: true, message: 'succes', amount: Math.ceil(rows.length/50)});
  
  } catch (err) {
    console.log(err)
    return res.status(500).json({ success: false, message: 'database error'});
  } finally {
    if (connection) connection.end();
  }
}

async function getRightProductTermein(req,res) {
 let connection
 try  {
  connection = await connectDB(db)
  let [productRows] = await connection.execute(
    "SELECT id, name, price_per FROM products",
  )

  if (productRows.length === 0) {
     return res.status(400).json({ success: false, message: 'no products found'});
  }
  return res.status(200).json({ success: true, message: 'succes', data: productRows});
     
 } catch(err) {
  console.log("an error occured in getRightProductTermein (data controller)", err)
    return res.status(500).json({ success: false, message: 'database error'});

 } finally {
  if (connection) connection.end();
 }
}

const fs = require("fs");
function writeJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}
async function changeDueDateStandard(req, res) {
  let {sessiontoken, newDue} = req.body
  let { valid, user_id } = await validateSessionToken(sessiontoken);
  if (valid == false) {
    return res.status(400).json({ success: false, message: "no valid session token", invalidsesh: true });
  }
  writeJSON("./settings.json", {"due-date-standard": Number(newDue)})
    return res.status(200).json({ success: true, message: "succesfull udpate" });

}

module.exports = { changeDueDateStandard,getRightProductTermein,getPageLength,dataFetchController, getUserDataController, invoiceDataController, userProfileController,debitorController, getInvoiceProducts,   createConceptInvoice, updateInvoiceProducts};