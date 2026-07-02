const express = require('express');
const app = express();
const path = require('path');
const res = require('express/lib/response');
const cron = require('node-cron');


const PORT = 80

// File config
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));



// Route imports
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const dataRoutes = require('./routes/data.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const productRoutes = require('./routes/product.routes');
const queryRoutes = require('./routes/query.routes');
const subscriptionsRoutes = require('./routes/subscriptions.routes');
const userRoutes = require('./routes/user.routes');
const verifyRoutes = require('./routes/verify.routes');
const pdfRoutes = require('./routes/pdf.routes');
const deleteRoutes = require('./routes/delete.routes');
const dbfetchRoutes = require('./routes/dbfetch.routes');
const emailRoutes = require('./routes/email.routes');



const { connectDB } = require('./Modules/DB_handler');
const { createRequire } = require('module');

// Route uses
app.use('/', authRoutes);
app.use('/', customerRoutes);
app.use('/', dataRoutes);
app.use('/', invoiceRoutes);
app.use('/', productRoutes);
app.use('/', queryRoutes);
app.use('/', subscriptionsRoutes);
app.use('/', userRoutes);
app.use('/', verifyRoutes);
app.use('/', pdfRoutes);
app.use('/', deleteRoutes);
app.use('/', emailRoutes);
app.use('/', dbfetchRoutes);




/* 
################################
##########GET REQUESTS##########
################################
*/
app.get("/", (req, res) => {
 res.sendFile(path.join(__dirname, "..", 'public', "Documents", "Login.html"))
});


app.get("/invoiceselect",async (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "invoiceShowPage.html"));
})

app.get("/userprofile",async (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "userprofile.html"));
})

app.get("/debitor",async (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "userinvoice.html"));
})

app.get("/editproduct",async (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "EditProduct.html"));
})

app.get("/products",async (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "productData.html"));
})

app.get("/makeuser", (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "Newuser.html")); 
});

app.get("/dashboard", (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "users.html")); 
});

app.get("/query", (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "AdminQuerys.html")); 
});

app.get("/invoicedata", (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "InvoicePage.html")); 
})

app.get("/settings", (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "settings.html")); 
})


app.get("/subscriptiondata", (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "Documents", "SubscriptionData.html")); 
})




app.listen(PORT , '0.0.0.0', async () => {
await makeSubscriptionInvoice()
    console.log("app running on your local IP adresss");
  cron.schedule('*/15 * * * *', async () => {
await makeSubscriptionInvoice();
await checkInvoices()
});

})
const time = {
 eenmalig: 0,
  wekelijks: 7 * 24 * 60 * 60,        // 7 days
  maandelijks: 30 * 24 * 60 * 60,     // 30 days
  kwartaal: 3 * 30 * 24 * 60 * 60,    // 90 days
  halfjaarlijks: 6 * 30 * 24 * 60 * 60, // 180 days
  jaarlijks: 365 * 24 * 60 * 60       // 365 days
};

const db = "invoicewebsite";
let connection


async function makeSubscriptionInvoice() {
 try {
connection = await connectDB(db);
let [rows] = await connection.execute(
    "SELECT * FROM subscriptions"
);

if (rows.length === 0) {
    console.log("return")
    return;
}

for (const element of rows) {
    // Check if an invoice already exists for this subscription recently
const now = new Date().getTime() / 1000;
const duration = time[element.subscription_length];

if (duration === undefined) {
  console.log("Invalid subscription length:", element.subscription_length);
  continue;
}

const fromTime = now - duration;
const fromDate = new Date(fromTime * 1000);
const formattedDate = fromDate.toISOString().slice(0, 10);
console.log(formattedDate)
let [data] = await connection.execute(
  "SELECT * FROM invoice_products WHERE subscription_id = ? AND date_created >= ?",
  [element.id, formattedDate]
);

if (data.length > 0) {
  console.log("skip")
  continue;
}
    const customer_id = element.user_id;     
    const address = element.adress || "N/A";    
    const invoice_date = new Date();          
    const due_date = new Date(); // set to date time later
    const status = "Afwachting";                
    const subtotal = element.price || 0;    
    const total = element.total || subtotal; 
    const product = element.name || "N/A"
    const date = new Date();                
    const restriction_level = element.restriction_level;           
    const amount = element.amount || 1;        
    const subscription_id = element.id;       
    const vat = element.vat || 0;            
    let [rows] = await connection.execute(
        `INSERT INTO invoices 
        (customer_id, address, invoice_date, due_date, send_status, status, subtotal, total, product, date, restriction_level, amount, subscription_id, vat)
        VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            customer_id, address, invoice_date, due_date, false,status, 
            subtotal, total, product, date, restriction_level, 
            amount, subscription_id, vat
        ]
    );


await connection.execute(
  `INSERT INTO invoice_products (
    invoice_id,
    subscription_id,
    name,
    price,
    amount,
    vat_percentage,
    date_created
  )
  SELECT 
    ?,
    subscription_id,
    name,
    price,
    amount,
    vat_percentage,
    ?
  FROM invoice_products
  WHERE subscription_id = ?`,
  [rows.insertId, new Date().toISOString().slice(0, 10), subscription_id]
);
 

    console.log(`Invoice created for subscription ${element.id}`);

    if (element.auto_send == true) {
           const response = await fetch('http://localhost/send-invoice?id='+rows.insertId, {
            method: 'POST',
        });


           if (response.ok) console.log(`Invoice send for subscription ${element.id} and new invoice ${rows.insertId}`)
    }
}






 } catch (err) {
  console.log("an error occured while creating subscription invoices (makeSubscriptionInvoice) ",  err)
 } finally {
    if (connection) {
        connection.end()
    }
 }
}

var invoiceConnecction
async function checkInvoices() {
    try {
        invoiceConnecction = await connectDB(db)
        const now = new Date()
        
let [rows] = await invoiceConnecction.execute(
  `
  UPDATE invoices
  SET status = 'Laat'
  WHERE due_date <= ? 
  `, // should be <= this is to test if it works tomorow
  [now]
);

      
    if (rows.affectedRows === 0) {
        console.log("no rows where affected")
    }
        
    } catch(err) {
        console.log("an error occured in checkInvoices error: "+ err)
    } finally { 
        if (connection) connection.end()
            }
}



async function deleteSessionTokens() {
    let connection;
    try {
     connection = await connectDB(db)

     let [succes] = await connection.execute(
        "DELETE FROM sessions"
    ) 

    if (succes.affectedRows === 0) {
        return false 
    } 

    return true 
    } catch (er) {
       console.log(er)
    } finally {
        if (connection) connection.end()
    }
}