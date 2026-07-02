const { connectDB } = require('../Modules/DB_handler');
const { validateSessionToken, testRestrictionLevel } = require('../Modules/miscFunctions');
const { decrypt, encrypt } = require('../Modules/Encryption');
 
const db = "invoicewebsite";

async function createInvoiceController(req, res) {
  let {sessiontoken, data, isSubscription, periodes, periodeType, subscriptionName, subscription_end} = req.body
  let customer_id = req.query.id;
  let productData = []
  let customProductData = []
  let allData = data
  /* 
   data= [
{vat_percentage: , price_per: , amount: ,name}
   ]
  */
   console.log(data)   
    // filter all the data based on version
  data.forEach((el) => {
    if (el.price_excl_vat == null ) {
        productData.push(el)
        return;
    }
    customProductData.push(el);
  })  
   
   let connection
  try {

        let { valid, user_id } = await validateSessionToken(sessiontoken);

    if (sessiontoken == null || valid == false) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }
   connection = await connectDB(db)
   let questionMarks = ""
   let nameData = []





    if (productData[0] != null) {
    //generate a query with all the product namess, without brackets tho add those later
    productData.forEach((el, i) => {
      if (el.name != null && el.name != "") { 
        nameData.push(el.name)
        questionMarks = questionMarks + "?"
      questionMarks += ",";
      }
    })

questionMarks = questionMarks.slice(0, -1) + '';
if (questionMarks != '') {
   let [rows] = await connection.execute(
  `
  SELECT *
  FROM products
  WHERE name IN (${questionMarks})
  ORDER BY FIELD(name, ${questionMarks})
  `,
  [...nameData, ...nameData]
);
const newData = productData.map((item, id) => {
  const matchingRow = rows.find((row) => row.name === item.name);
  return {
    ...matchingRow,
    amount: item.amount,
    isSubscription: item.isSubscription,
    termein: item["dropdown-termein"],
    endDate: item.endDate,
    id: id
  }; 
});
productData = newData;
//console.log("products", productData)

}


   }
allData = productData.concat(customProductData)


   //calculate and make the actual invoice 
   //calculate subtotal
   let subtotal = 0;
   allData.forEach((el) => {
    if (el.price_excl_vat != undefined &&el.amount != undefined ){
     subtotal = subtotal + Number(el.price_excl_vat)*Number(el.amount)
    }
   })
   //calculate total
   let total = 0 ;
   allData.forEach((el) => {
    if (el.price_excl_vat != undefined &&el.amount != undefined ){
     total += el.price_excl_vat * el.amount * (1 + el.vat_percentage / 100)
    }
   })


   //add subscription 
   




  //get adress
   let [adressRows] = await connection.execute(
    'SELECT address FROM customers WHERE customer_id = ?',
    [customer_id]
  );



  
  if (adressRows.length <= 0) {
    return res.status(400).json({ success: false, message: "Couldnt find adress." });
  }

  let address = adressRows[0].address;
  // define other variables
  const send_status = false;
  const status = "Afwachting"
  const invoice_date = new Date()
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  let [inserted] = await connection.execute(
  `INSERT INTO invoices (
      customer_id,
      address,
      invoice_date,
      due_date,
      status,
      subtotal,
      total,
      date,
      subscription_id,
      send_status
  ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
  [
customer_id,
address,
invoice_date,
nextWeek,
status,
subtotal.toFixed(2),
total.toFixed(2),
invoice_date,
subscriptionId || null,
send_status
  ]
);
 
let invoiceId = inserted.insertId// set to query above its insertrow 
var subscriptionId


//get all subscriptions
let subscriptions = [];
allData.forEach((el, index) => {
  if (el.isSubscription == true) {
    el["referenceId"] = index
    subscriptions.push(el);
  }
}
)

//filter out info for query, make sure fields are in order. 
let newSubscriptions = []
subscriptions.forEach( (el) =>{
  let subtotal = el.price_excl_vat*Number(el.amount)
  let total = (subtotal*((el.vat_percentage/100) +1)).toFixed(2)
  console.log("total" , total)
  newSubscriptions.push([el.name, new Date(), el.vat_percentage, subtotal, total, customer_id, el.termein, address, el.endDate])}
)
console.log("new", newSubscriptions)
// insert the data
if (newSubscriptions.length > 0) {
const [subscriptionRows] = await connection.query(
  "INSERT INTO subscriptions (name, start_date, vat, price, total, user_id, subscription_length, adress, ends_at) VALUES ?",
  [newSubscriptions] // note the extra array wrapping
);

const firstId = subscriptionRows.insertId;

// Attach subscriptionId to each subscription
subscriptions.forEach((subscription, index) => {
    // subscriptionId = first insertId + index
    allData[subscription.referenceId]["subscriptionId"] =   firstId + index ;
});



if (subscriptionRows.length === 0) {
   return res.status(400).json({ success: false, message: "Couldnt find adress." });
}


}


/*
   if (isSubscription) {
    
const subScriptionValues = allData.map(item => ([
  invoiceId,           // invoice_id (same for all rows)
  item.price_excl_vat,      // price
  item.amount,         // amount
  item.vat_percentage  // vat_percentage
]));

//set variables right
let [result] = await connection.execute(
  "INSERT INTO subscriptions (name, subscription_length, price, periodes, user_id, total, adress, ends_at ) VALUES (?,?,?,?,?,?,?,?)",
  [
    subscriptionName,
    periodeType, // means subscription length
    subtotal,    //subtotal
    periodes,    // amount of months its going for 
    customer_id, // customer_id
    total.toFixed(2),
    address,
    subscription_end
  ]
 );

subscriptionId = result.insertId
} */

//console.log("all", allData)
const values = allData.map(item => ([
  invoiceId,           // invoice_id (same for all rows)
  item.subscriptionId,               // subscription_id
  item.price_excl_vat,      // price
 Number(item.amount),         // amount
  item.vat_percentage,  // vat_percentage
  item.name,
  new Date()
]));



const sql = `
  INSERT INTO invoice_products
  (invoice_id, subscription_id, price, amount, vat_percentage, name, date_created)
  VALUES ?
`;

await connection.query(sql, [values]);


return res.status(200).json({ success: true, message: "Factuur succesvol aangemaakt!" });
  } catch (err) {
    console.log("An error occured in createInvoice, error: ", err)
    return res.status(500).json({ success: false, message: "Database error" });
  } finally{
    if (connection) {
      connection.end
    }
  }
}


//createinvoice
/*
async function createInvoiceController(req, res) {
    let connection;
    let customer_id = req.query.id;
    let status = "Afwachting" // Afwachting Betaald Laat
    let {
       
        subtotal,
        sessiontoken,
        product,
        amount,
        getProductPrice,
        restriction_level,
        addSubScription,
        name,
        subscription_length,
        periodes,
        vat
    } = req.body;
    let price_per = subtotal
     const qty = Number(amount) || 1;

                subtotal = subtotal * qty ;
    try {
      
        connection = await connectDB(db);
                let [adressRows] = await connection.execute(
            'SELECT address FROM customers WHERE customer_id = ?',
            [customer_id]
        );

        if (adressRows.length <= 0) {
            return res.status(400).json({ success: false, message: "Couldnt find adress." });
        }

        let address = adressRows[0].address;
        let { valid, user_id } = await validateSessionToken(sessiontoken);
        if (!valid || !sessiontoken) {
            return res.status(400).json({ success: false, message: "Geen geldige sessie" });
        }

        let subscriptionId = null;
        let vatInsert = vat
        let totalInsert = subtotal * (1 + vatInsert / 100);
totalInsert = Number(totalInsert.toFixed(2)); // rounds to 2 decimals as a number

        if (getProductPrice === true) {
            const [prodRows] = await connection.execute(
                "SELECT price_excl_vat, vat_percentage FROM products WHERE name = ? LIMIT 1",
                [product]
            );
   
            if (prodRows.length > 0) {
                const prod = prodRows[0];
                const price = parseFloat(prod.price_excl_vat);
                const vat = parseFloat(prod.vat_percentage ?? 0);
            
                totalInsert = price * (1 + vat / 100) * qty;
                vatInsert = prod.vat_percentage
                subtotal = prod.price_excl_vat * Number(amount) 
                price_per = prod.price_excl_vat
            }
        }
        if (addSubScription == true) {

let [result] = await connection.execute(
  "INSERT INTO subscriptions (name, subscription_length, price, periodes, user_id, amount, total, vat, restriction_level, adress) VALUES (?,?,?,?,?,?,?,?,?,?)",
  [
    name,
    subscription_length,
    subtotal,     // price per unit
    periodes,
    customer_id,
    amount,
    totalInsert,   // full total incl VAT
    vatInsert,
    restriction_level,
    address
  ]
);
            

            if (result.affectedRows <= 0) {
                return res.status(400).json({ success: false, message: "Something went wrong whilst creating subscription" });
            }

            subscriptionId = result.insertId;
        }

        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invoicedate = new Date(Date.now());
         console.log(typeof price_per)
await connection.execute(
  `INSERT INTO invoices (
      customer_id,
      address,
      invoice_date,
      due_date,
      status,
      subtotal,
      total,
      date,
      product,
      amount,
      restriction_level,
      subscription_id,
      vat,
      price_per,
      send_status
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  [
customer_id,
address,
invoicedate,
nextWeek,
status,
subtotal.toFixed(2),
totalInsert.toFixed(2),
invoicedate,
product,
amount,
restriction_level,
subscriptionId,
vatInsert,
Number(price_per).toFixed(2),
false
  ]
);



        return res.status(200).json({ success: true, message: "Factuur succesvol aangemaakt!" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Database fout" });
    } finally {
        if (connection) connection.end();
    }
}
*/
//fetchinvoicedata
async function fetchInvoiceData(req, res) { 
  let connection;
  const { sessiontoken, filter, page } = req.body;
const limit = 50; 
const amount = page * limit - limit; 

  try {
    connection = await connectDB(db);
    let { valid, user_id } = await validateSessionToken(sessiontoken);

    if (sessiontoken == null || valid == false) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }


    let rows;
if (filter != null) {
  switch (filter) {
    case "Alles":
      [rows] = await connection.execute(
        "SELECT * FROM invoices  LIMIT ?, ?",
        [amount, limit]
      );
      break;
    case "Betaald":
      [rows] = await connection.execute(
        "SELECT * FROM invoices WHERE status = 'Betaald' LIMIT ?, ?",
        [ amount, limit]
      );
      break;
    case "Laat":
      [rows] = await connection.execute(
        "SELECT * FROM invoices WHERE status = 'Laat' LIMIT ?, ?",
        [amount, limit]
      );
      break;
    case "Afwachting":
      [rows] = await connection.execute(
        "SELECT * FROM invoices WHERE status = 'Afwachting' LIMIT ?, ?",
        [ amount, limit]
      );
      break;
        case "Verzonden":
      [rows] = await connection.execute(
      `SELECT invoices.*
       FROM invoices
       LEFT JOIN sent_invoices 
       ON sent_invoices.invoice_id = invoices.id
       WHERE sent_invoices.invoice_id IS NOT NULL
       OR invoices.send_status = TRUE
         `
        );
      break;
           case "Concept":
      [rows] = await connection.execute(
      `SELECT * FROM invoices WHERE send_status = false
         `,
      );
      break;
    default:
      [rows] = await connection.execute(
        "SELECT * FROM invoices LIMIT ?, ?",
        [amount, limit]
      );
      
   

      break;
  }
} else {
  [rows] = await connection.execute(
    "SELECT * FROM invoices WHERE LIMIT ?, ?",
    [amount, limit]
  );
}



    if (rows.length <= 0) {
      return res.status(400).json({ success: true, message: 'No products found' }); 
    }

    rows.forEach(row => {
      row.address = decrypt(row.address);
    });

    return res.status(200).json({ success: true, message: 'Succesfull fetch', data: rows }); 

  } catch (error) {
    console.log("A database error has occured: " + error);
    return res.status(500).json({ success: true, message: 'Database error' }); 
  } finally {
    if (connection) {
      connection.end();
    }
  }
}


async function updateSubscription(req, res) {
  let {invoice_productId, name, price, subscription_length, amount, adress, vat, ends_at, id} = req.body 
  let connection;
  let inserted = invoice_productId
  try {
    connection = await connectDB(db) 

    /* check if invoice id is in the invoice product,
       if so clone it (this is so we dont alter any actual invoices), 
       if it doesnt have an invoice id it means its been updated before and therefore can be directly set
    */
    let [invoiceIdRows] = await connection.execute(
      "SELECT invoice_id FROM invoice_products WHERE id = ?",
      [invoice_productId]
    ) 
    //check and if invoice id then copy 
    if (invoiceIdRows.invoice_id != null) {
    let [cloneRows] = await connection.execute(
      `INSERT INTO invoice_products (
      subscription_id,
      name,
      price,
      amount,
      vat_percentage
      )
      SELECT
      subscription_id,
      name,
      price,
      amount,
      vat_percentage
      FROM invoice_products
      WHERE id = ?;`,
      [invoice_productId]
    )
    
    if (cloneRows.insertId != null) {
      return res.status(400).json({ success: false, message: "er is iets fout gegaan tijdens het updaten van het abonnement" });
    }
    inserted = cloneRows.insertId
  }

    let subtotal = price*amount
    let total =  subtotal*((vat/100)+1)

 

    // update the subscription itself
    let [rows] = await connection.execute(
      "UPDATE subscriptions SET total = ?, price = ?, name = ?, subscription_length = ?, vat =? ,adress =? , ends_at = ? WHERE id = ?",
      [total, subtotal, name, subscription_length, vat,encrypt(adress), ends_at, id]
    )

console.log(  [total, subtotal, name, subscription_length, vat,encrypt(adress), ends_at, id])
    let [subscriptionProductRows] = await connection.execute(
      "UPDATE invoice_products SET name = ?, price = ?, amount = ?, vat_percentage = ? WHERE id = ?",
      [name, price, amount, vat, inserted]
    )
    if (rows.affectedRows === 0 || subscriptionProductRows.affectedRows === 0) {
      console.log("hier")
      return res.status(400).json({ success: false, message: "er is iets fout gegaan tijdens het updaten van het abonnement" });
    }

      

      return res.status(200).json({ success: false, message: "success" });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ success: false, message: "database error" });

  } finally {
    if (connection) connection.end();
  }
}






module.exports = { updateSubscription ,createInvoiceController, fetchInvoiceData };