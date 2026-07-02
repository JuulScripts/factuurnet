
const { validateSessionToken } = require('../Modules/miscFunctions');
const { connectDB } = require('../Modules/DB_handler');
const { testRestrictionLevel } = require('../Modules/miscFunctions');
const {  createSHA256, createArgon2 } = require('../Modules/Hashing');
const {encrypt} =  require('../Modules/Encryption');
const db = "invoicewebsite";




//createnewcustomer
async function createNewCustomerController(req, res) {
    let connection;
    const {
  name,
  email,
  phonenumber,
  mobile_number,
  fax_number,
  company_name,
  chamber_of_commerce_number,
  vat_number,
  peppol_id,
  contact_person,
  website,
  address,
  postal_code_city,
  country,
  lastname,
  sessiontoken,
  city
} = req.body;


    try {
        connection = await connectDB(db);

        if (sessiontoken == null) {
            return res.status(400).json({ success: false, message: "No valid session token." });
        }


        if (!connection) {
            return res.status(500).json({ success: false, message: "Database connection failed" });
        }

        let [rows] = await connection.execute(
            "SELECT token FROM sessions WHERE token = ?",
            [createSHA256(sessiontoken)]
        );

        if (rows.length <= 0) {
            return res.status(400).json({ success: false, message: "not a valid session token" });
        }

        if (!name || !email || !phonenumber ) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
await connection.execute(
  `INSERT INTO customers (
    name, email, phonenumber,  address, company_name,
    chamber_of_commerce_number, vat_number, peppol_id, contact_person,
    postal_code_city, country, mobile_number, fax_number, website, lastname, city
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?)`,
  [
    name ? encrypt(name) : null,
    email ? encrypt(email) : null,
    phonenumber ? encrypt(phonenumber) : null,
    address ? encrypt(address) : null,
    company_name ? encrypt(company_name) : null,
    chamber_of_commerce_number ? encrypt(chamber_of_commerce_number) : null,
    vat_number ? encrypt(vat_number) : null,
    peppol_id || null,
    contact_person || null,
    postal_code_city ? encrypt(postal_code_city) : null,
    country ? encrypt(country) : null,
    mobile_number ? encrypt(mobile_number) : null,
    fax_number ? encrypt(fax_number) : null,
    website || null,
    lastname ? encrypt(lastname) : null,
    city ? encrypt(city) : null
  ]
);


        return res.status(200).json({ success: true, message: "Customer added successfully" });

    } catch (err) {
      console.log("error in createnwcustomer", err)
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ success: false, message: "User ID already exists" });
        }
        return res.status(500).json({ success: false, message: "Unexpected database error" });
    } finally {
        if (connection) {
            connection.end();
        }
    }
}
// /updateuserprofile
async function updateUserProfileController(req, res) {
  let connection;
 const {
  customer_id,
  name,
  company_name,
  contact_person,
  email,
  website,
  phone_number,
  mobile_number,
  fax_number,
  address,
  postal_code_city,
  country,
  chamber_of_commerce_number,
  vat_number,
  peppol_id,
  lastname,
  notes,
  sessiontoken,
  city 
} = req.body;
  let id = req.query.id;

  try {
    connection = await connectDB(db);

    // Validate session token
    const { valid } = await validateSessionToken(sessiontoken);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Invalid session token" });
    }

const [result] = await connection.execute(
  `UPDATE customers
   SET
     name = ?,
     email = ?,
     phonenumber = ?,
     address = ?,
     company_name = ?,
     chamber_of_commerce_number = ?,
     vat_number = ?,
     peppol_id = ?,
     contact_person = ?,
     postal_code_city = ?,
     country = ?,
     mobile_number = ?,
     fax_number = ?,
     website = ?,
     lastname = ?,
     notes = ?,
     city = ?
   WHERE customer_id = ?`,
  [
    name ? encrypt(name) : null,
    email ? encrypt(email) : null,
    phone_number ? encrypt(phone_number) : null,
    address ? encrypt(address) : null,
    company_name ? encrypt(company_name) : null,
    chamber_of_commerce_number ? encrypt(chamber_of_commerce_number) : null,
    vat_number ? encrypt(vat_number) : null,
    peppol_id || null,
    contact_person || null,
    postal_code_city ? encrypt(postal_code_city) : null,
    country ? encrypt(country) : null,
    mobile_number ? encrypt(mobile_number) : null,
    fax_number ? encrypt(fax_number) : null,
    website || null,
    lastname ? encrypt(lastname) : null,
    notes ? encrypt(notes) : null,
    city ? encrypt(city) : null,

    customer_id
  ]
);


    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: "Customer not found (ID mismatch)" });
    }

    return res.status(200).json({ success: true, message: "Profiel succesvol bijgewerkt" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
}



async function updatePass(req, res) {
  let connection 
  let {sessiontoken, pass, id} = req.body

  try {
       let { valid, user_id } = await validateSessionToken(sessiontoken);
    if ( sessiontoken == null ||valid == false ) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }
    connection = await connectDB(db)
    if (pass == null || pass == "")       return res.status(400).json({ success: false, message: "No password" });
    let [rows] = await connection.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [await createArgon2(pass), id]
    )
  
    await connection.execute("DELETE FROM sessions WHERE user_id = ?", [id])

    if (rows.affectedRows == 0) {
      return res.status(400).json({ success: false, message: "Something wen twrong whilst updating password" });
    }
      return res.status(200).json({ success: true, message: "Password updated succesfully" });

  } catch (er) {
    console.log(er)
    return res.status(500).json({ success: false, message: "Database error" });
    
  } finally {
    if (connection) connection.end();
  }
}

module.exports = { updatePass,createNewCustomerController,updateUserProfileController };