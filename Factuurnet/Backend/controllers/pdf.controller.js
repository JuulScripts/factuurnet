const PDFDocument = require('pdfkit');
const { connectDB } = require('../Modules/DB_handler');
const { validateSessionToken, testRestrictionLevel } = require('../Modules/miscFunctions');
const db = "invoicewebsite";
const fs = require("fs");
const {decrypt} = require('../Modules/Encryption');


const formatter = new Intl.NumberFormat('nl-NL');

function formatString(str) {
  return str.replace(/\d+\.\d+/g, match =>
    formatter.format(Number(match))
  );
}



const downloadInvoice = async (req, res) => {
    const invoiceId  = req.query.id;
    let connection;
    try {
        connection = await connectDB(db)
        let [rows] = await connection.execute(
            "SELECT * FROM invoices WHERE id = ?",
            [invoiceId]
        ) 
        
        

        if (rows.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "No invoice found" });
        }

        let invoice = rows[0]
        if (!invoice) {
            return res.status(404).send("Invoice not found");
        }
 let [nameRows] = await connection.execute(
            "SELECT name, postal_code_city, company_name FROM customers WHERE customer_id = ?",
            [rows[0].customer_id]
        ) 
 
        let [invoiceProductRows] = await connection.execute(
            "SELECT * FROM invoice_products WHERE invoice_id = ?",
            [invoiceId]
        ) 

          if (nameRows.length === 0 || invoiceProductRows.length === 0) {
            return false
        }



        

        let customerName = nameRows[0].name
        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoiceId}.pdf`);

        // Create PDF
        const doc = new PDFDocument();

const formatter = new Intl.NumberFormat('nl-NL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const originalText = doc.text.bind(doc);

doc.text = function(value, ...args) {
  if (typeof value === 'number') {
    value = formatter.format(value);
  }
  return originalText(value, ...args);
};
        doc.pipe(res); // stream PDF directly to response
const topY = 40;
const logoWidth = 200;

// LEFT: Image
doc.image(process.env.LOGO_PATH, 50, topY, {
  width: logoWidth
});

doc
  .fontSize(13)
  .text(process.env.COMPANY_INFO, 50 + logoWidth + 20, topY, {
    align: 'right',
    width: doc.page.width - (50 + logoWidth + 20) - 50
  });

  
// Move cursor to vertical middle of the page
doc.y = doc.page.height / 2 - 100; // adjust offset if needed
doc.x = doc.page.width / 3 - 100; // adjust offset if needed


 

        // Add content
        doc.moveDown();
        //name
               doc.fontSize(14).text(`Klant Naam: ${decrypt(nameRows[0]?.company_name || customerName)}`, { align: 'left' });

        //adress and customer id 
        doc.fontSize(14).text(decrypt(invoice.address), {align: 'left', continued: true});
        doc.fontSize(14).text(`Klant nummer: ${invoice.customer_id}`, {align: 'right'});
        
        //postcode factuurnummer 
        //postcode (left continued, true)
        doc.fontSize(14).text( decrypt(nameRows[0].postal_code_city), {align: 'left', continued: true});
        doc.fontSize(14).text(`Factuur nummer: ${invoice.id}`, {align: 'right'});
        
        //plaats 
        doc.text(`Nederland`, {align: 'left', continued: true});
        doc.text(`Factuurdatum: ${invoice.invoice_date} `, {align: 'right'});

//add company

//COLUMNS
      doc.moveDown();
      doc.moveDown();

const headerY = doc.y;

// column X positions
// column X positions (even spacing, no right alignment)
// column X positions (safe spacing)
const COL_AANTAL  = 60;
const COL_PRODUCT = 160;
const COL_PRIJS   = 260;
const COL_BTW     = 360;
const COL_TOTAAL  = 460;

// ===== HEADERS =====
doc.text('Aantal', COL_AANTAL, headerY);
doc.text('Product', COL_PRODUCT, headerY);
doc.text('Prijs per stuk', COL_PRIJS, headerY);
doc.text('BTW', COL_BTW, headerY);
doc.text('Totaal', COL_TOTAAL, headerY);
// ===== DIVIDER LINE =====
const lineY = headerY + 25;

doc.moveTo(COL_AANTAL, lineY)
   .lineTo(COL_TOTAAL+150, lineY)
   .stroke();

// ===== DATA ROW =====
let rowY = headerY + 27; // start under headers

invoiceProductRows.forEach(row => {
  let total = row.price * Number(row.amount) //* (row.vat_percentage/100 + 1) met btw
  doc.fontSize(11);
  // Row values
  doc.text(String(row.amount), COL_AANTAL, rowY);
  doc.text(row.name, COL_PRODUCT, rowY);
  doc.text(`€${row.price.toFixed(2)}`, COL_PRIJS, rowY);
  doc.text(`${row.vat_percentage}%`, COL_BTW, rowY);
  doc.text(`€${total.toFixed(2)}`, COL_TOTAAL, rowY);


  rowY += 20; // move down for next row
});

const pageWidth  = doc.page.width;
const pageHeight = doc.page.height;

const LABEL_X    = 400;
const CURRENCY_X = 520;
const VALUE_X    = 550;

const START_Y = pageHeight - 200;
const LINE_HEIGHT = 20;
const LINE_OFFSET = 6; // distance below text

// VAT calculation
const vatRate = 0.21;
const vatAmount = invoice.subtotal * vatRate;
const totalIncl = invoice.subtotal + vatAmount;

// Row 1 — Excl VAT
let y = START_Y;
doc.font('Helvetica');
doc.text('Totaal excl. BTW', LABEL_X, y);
doc.text('€', CURRENCY_X, y);
doc.text(invoice.subtotal.toFixed(2), VALUE_X, y, { width: 40, align: 'right' });

// Line under Row 1 (slightly below text)
doc.moveTo(LABEL_X, y + LINE_HEIGHT - LINE_OFFSET)
   .lineTo(VALUE_X + 40, y + LINE_HEIGHT - LINE_OFFSET)
   .stroke();

// Row 2 — VAT
y += LINE_HEIGHT;
doc.text(`BTW ${vatRate * 100}%`, LABEL_X, y);
doc.text('€', CURRENCY_X, y);
doc.text(vatAmount.toFixed(2), VALUE_X, y, { width: 40, align: 'right' });

// Line under Row 2 (slightly below text)
doc.moveTo(LABEL_X, y + LINE_HEIGHT - LINE_OFFSET)
   .lineTo(VALUE_X + 40, y + LINE_HEIGHT - LINE_OFFSET)
   .stroke();

// Row 3 — Incl VAT (bold)
y += LINE_HEIGHT;
doc.font('Helvetica-Bold');
doc.text('Totaal incl. BTW', LABEL_X, y);
doc.text('€', CURRENCY_X, y);
doc.text(totalIncl.toFixed(2), VALUE_X, y, { width: 40, align: 'right' }); //here


doc.font('Helvetica'); // reset

/*
        doc.text(`Due Date: ${invoice.due_date}`, {align: 'center'});
        doc.text(`Total: $${invoice.total}`, {align: 'center'});
        doc.text(`VAT: $${invoice.vat}`, {align: 'center'});
        doc.moveDown();
        doc.text("Products:", {align: 'center'});
        doc.text(invoice.product || "No product info", {align: 'center'});
*/
        doc.end(); // finalize PDF
    } catch (err) {
        console.log(err)
        return false
    } finally {
        if (connection) {
            await connection.end()
        }
    }
};












async function bufferInvoice(invoiceId) {
    let connection;
    try {

        connection = await connectDB(db)
        let [rows] = await connection.execute(
            "SELECT * FROM invoices WHERE id = ?",
            [invoiceId]
        ) 
        
        

        if (rows.length === 0) {
            return false
        }

        let invoice = rows[0]
        if (!invoice) {
           false
        }
 let [nameRows] = await connection.execute(
            "SELECT name, postal_code_city, company_name FROM customers WHERE customer_id = ?",
            [rows[0].customer_id]
        ) 
 
        let [invoiceProductRows] = await connection.execute(
            "SELECT * FROM invoice_products WHERE invoice_id = ?",
            [invoiceId]
        ) 

          if (nameRows.length === 0 || invoiceProductRows.length === 0) {
            return false
        }



        

        let customerName = nameRows[0].name
        const company_name = nameRows[0].company_name
        // Set headers for PDF download
      
        // Create PDF
      return new Promise(  (resolve, reject) => { 
        const chunks = [];

        const doc = new PDFDocument();
        const formatter = new Intl.NumberFormat('nl-NL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const originalText = doc.text.bind(doc);

doc.text = function(value, ...args) {
  if (typeof value === 'number') {
    value = formatter.format(value);
  }
  return originalText(value, ...args);
};
doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    resolve(pdfBuffer);
});
 
const topY = 40;
const logoWidth = 200;

// LEFT: Image
doc.image(process.env.LOGO_PATH, 50, topY, {
  width: logoWidth
});

doc
  .fontSize(13)
  .text(process.env.COMPANY_INFO, 50 + logoWidth + 20, topY, {
    align: 'right',
    width: doc.page.width - (50 + logoWidth + 20) - 50
  });

  
// Move cursor to vertical middle of the page
doc.y = doc.page.height / 2 - 100; // adjust offset if needed
doc.x = doc.page.width / 3 - 100; // adjust offset if needed


 

        // Add content
        doc.moveDown();
        //name
        doc.fontSize(14).text(`Klant Naam: ${decrypt(nameRows[0]?.company_name || customerName)}`, { align: 'left' });
        //adress and customer id 
        doc.fontSize(14).text(decrypt(invoice.address), {align: 'left', continued: true});
        doc.fontSize(14).text(`Klant nummer: ${invoice.customer_id}`, {align: 'right'});
        
        //postcode factuurnummer 
        //postcode (left continued, true)
        doc.fontSize(14).text( decrypt(nameRows[0].postal_code_city), {align: 'left', continued: true});
        doc.fontSize(14).text(`Factuur nummer: ${invoice.id}`, {align: 'right'});
        
        //plaats 
        doc.text(`Nederland`, {align: 'left', continued: true});
        doc.text(`Factuurdatum: ${invoice.invoice_date} `, {align: 'right'});

//add company

//COLUMNS
      doc.moveDown();
      doc.moveDown();

const headerY = doc.y;

// column X positions
// column X positions (even spacing, no right alignment)
// column X positions (safe spacing)
const COL_AANTAL  = 60;
const COL_PRODUCT = 160;
const COL_PRIJS   = 260;
const COL_BTW     = 360;
const COL_TOTAAL  = 460;

// ===== HEADERS =====
doc.text('Aantal', COL_AANTAL, headerY);
doc.text('Product', COL_PRODUCT, headerY);
doc.text('Prijs per stuk', COL_PRIJS, headerY);
doc.text('BTW', COL_BTW, headerY);
doc.text('Totaal', COL_TOTAAL, headerY);
// ===== DIVIDER LINE =====
const lineY = headerY + 25;

doc.moveTo(COL_AANTAL, lineY)
   .lineTo(COL_TOTAAL+150, lineY)
   .stroke();

// ===== DATA ROW =====
let rowY = headerY + 27; // start under headers

invoiceProductRows.forEach(row => {
   let total = row.price * Number(row.amount) //* (row.vat_percentage/100 + 1) met btw

  doc.fontSize(11);
  // Row values
  doc.text(String(row.amount), COL_AANTAL, rowY);
  doc.text(row.name, COL_PRODUCT, rowY);
  doc.text(`€${row.price.toFixed(2)}`, COL_PRIJS, rowY);
  doc.text(`${row.vat_percentage}%`, COL_BTW, rowY);
  doc.text(`€${total.toFixed(2)}`, COL_TOTAAL, rowY);


  rowY += 20; // move down for next row
});

const pageWidth  = doc.page.width;
const pageHeight = doc.page.height;

// Horizontal positions
const LABEL_X    = 400;
const CURRENCY_X = 520;
const VALUE_X    = 550;

const START_Y = pageHeight - 200;
const LINE_HEIGHT = 20;
const LINE_OFFSET = 6; // distance below text

// VAT calculation
const vatRate = 0.21;
const vatAmount = invoice.subtotal * vatRate;
const totalIncl = invoice.subtotal + vatAmount;

// Row 1 — Excl VAT
let y = START_Y;
doc.font('Helvetica');
doc.text('Totaal excl. BTW', LABEL_X, y);
doc.text('€', CURRENCY_X, y);
doc.text(invoice.subtotal.toFixed(2), VALUE_X, y, { width: 40, align: 'right' });

// Line under Row 1 (slightly below text)
doc.moveTo(LABEL_X, y + LINE_HEIGHT - LINE_OFFSET)
   .lineTo(VALUE_X + 40, y + LINE_HEIGHT - LINE_OFFSET)
   .stroke();

// Row 2 — VAT
y += LINE_HEIGHT;
doc.text(`BTW ${vatRate * 100}%`, LABEL_X, y);
doc.text('€', CURRENCY_X, y);
doc.text(vatAmount.toFixed(2), VALUE_X, y, { width: 40, align: 'right' });

// Line under Row 2 (slightly below text)
doc.moveTo(LABEL_X, y + LINE_HEIGHT - LINE_OFFSET)
   .lineTo(VALUE_X + 40, y + LINE_HEIGHT - LINE_OFFSET)
   .stroke();

// Row 3 — Incl VAT (bold)
y += LINE_HEIGHT;
doc.font('Helvetica-Bold');
doc.text('Totaal incl. BTW', LABEL_X, y);
doc.text('€', CURRENCY_X, y);
doc.text(totalIncl.toFixed(2), VALUE_X, y, { width: 40, align: 'right' }); //here

doc.font('Helvetica'); // reset

/*
        doc.text(`Due Date: ${invoice.due_date}`, {align: 'center'});
        doc.text(`Total: $${invoice.total}`, {align: 'center'});
        doc.text(`VAT: $${invoice.vat}`, {align: 'center'});
        doc.moveDown();
        doc.text("Products:", {align: 'center'});
        doc.text(invoice.product || "No product info", {align: 'center'});
*/
        doc.end(); // finalize PDF
})

    } catch (err) {
        console.log(err)
        return false
    } finally {
        if (connection) {
            await connection.end()
        }
    }

};


// CommonJS export
module.exports = { downloadInvoice, bufferInvoice };
