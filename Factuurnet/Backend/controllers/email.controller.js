const nodemailer = require('nodemailer');
const { connectDB } = require('../Modules/DB_handler');
const { decrypt } = require('../Modules/Encryption');
const { bufferInvoice } = require('./pdf.controller');
const db = "invoicewebsite";
const fs = require("fs");
 

function readJSON(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}



// Replace these with your SMTP server details
let transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER, // your SMTP server
    port: process.env.SMTP_PORT,                // usually 587 (TLS) or 465 (SSL)
   secure: process.env.SSL_STATE === "true",           // true for 465, false for other ports
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD
    }
});
 

// Function to send an email
async function sendEmail(to, subject, text, invoiceId) {
  const pdfBuffer = await bufferInvoice(invoiceId)

  const mailOptions = {
    from: process.env.FROM_EMAIL, 
    to: to,                        
    subject: subject,          
    text: text,     
    attachments: [
        { filename: `invoice_${invoiceId}.pdf`, content: pdfBuffer }
    ]               
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

function formatDateNDaysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const formatted = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return formatted;
}
async function sendInvoice(req, res) {
    let connection 
    let id = req.query.id
    try {
        connection = await connectDB(db)
        


        let [userRows] = await connection.execute(
           `SELECT customers.*
   FROM invoices
   JOIN customers ON customers.customer_id = invoices.customer_id
   WHERE invoices.id = ?`,
  [id]
        ) 
       
 if (userRows.length === 0 ) {
             return res
                .status(400)
                .json({ success: false, message: "something went wrong whilst sending invoice" });
        }

        let debitorData = userRows[0]
        console.log(debitorData)
      await sendEmail(decrypt(debitorData.email),  "Factuur", "er is een factuur verzonden", id)
 
         

    let [rows] = await connection.execute(
  "INSERT INTO sent_invoices (invoice_id) VALUES (?)",
  [id]
);

        if (rows.length === 0 ) {
             return res
                .status(400)
                .json({ success: false, message: "something went wrong whilst sending invoice" });
        }

       let [updateRows] = await connection.execute(
        "UPDATE invoices SET send_status = true, show_id = ?, due_date = ? WHERE id = ?",
        [rows.insertId, formatDateNDaysFromNow(readJSON("./settings.json")["due-date-standard"]),id]
       )


       
        if (updateRows.affectedRows === 0 ) {
             return res
                .status(400)
                .json({ success: false, message: "something went wrong whilst sending invoice" });
        }

return res.status(200).json({ success: true, message: "succesfully updated invoice" });

    } catch (err) {
        console.log("something wehn twrong in sendInvoice error: ", err)
         return res
                .status(500)
                .json({ success: false, message: "database error" });
    } finally {
        if (connection) connection.end();
    }
}

module.exports = { sendInvoice };
