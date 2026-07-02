// controllers/productController.js

const { connectDB } = require('../Modules/DB_handler');
const { validateSessionToken } = require('../Modules/miscFunctions');
const db = "invoicewebsite";

//createproduct
async function createProduct(req, res) {
    const { Name, description, type, price, vat, pricePer, costPrice, sessiontoken } = req.body;

    let connection;

    try {
        connection = await connectDB(db);

        let { valid, user_id } = await validateSessionToken(sessiontoken);

        if (sessiontoken == null || valid == false) {
            return res
                .status(400)
                .json({ success: false, message: "no valid session token" });
        }

        const [rows] = await connection.execute(
            `INSERT INTO products 
       (name, invoice_description, unit, price_excl_vat, vat_percentage, price_per, cost_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [Name, description, type, price, vat, pricePer, costPrice]
        );

        return res.status(200).json({ success: true, message: 'user created succesfully' });
    } catch (err) {
        console.log("a database error has occured: " + err);
        return res.status(500).json({ success: false, message: 'database error' });

    } finally {
        if (connection) {
            connection.end();
        }
    }
};

// data/editproduct
async function editProduct(req, res) {
  let id = req.query.id 
  let connection
  let {sessiontoken} = req.body 

  try {
  connection = await connectDB(db)


   let { valid, user_id } = await validateSessionToken(sessiontoken);
    if ( sessiontoken == null ||valid == false ) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }
       let [rows] = await connection.execute(
      "SELECT * FROM products WHERE id = ?",
      [id] 
    )


         if (rows.length <= 0 ) {
      return res
        .status(400)
        .json({ success: false, message: "no rows found" });
    }

    
  


    return res.status(200).json({ success: true, message: 'succes', data:rows[0] });

  } catch (err) {
    console.log(err)
    return res.status(500).json({ success: false, message: 'database error' });
  }
}



//data/saveproduct
async function saveProduct(req, res) { 
  let id = req.query.id 
  let connection
  let {name,invoice_description,unit,price_excl_vat,vat_percentage,price_per,cost_type,sessiontoken} = req.body 

  try {
    connection = await connectDB(db)
    let { valid, user_id } = await validateSessionToken(sessiontoken);

    if ( sessiontoken == null || valid == false ) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }

    
    let [rows] = await connection.execute(
      `UPDATE products 
       SET name = ?, 
           invoice_description = ?, 
           unit = ?, 
           price_excl_vat = ?, 
           vat_percentage = ?, 
           price_per = ?, 
           cost_type = ? 
       WHERE id = ?`,
      [name, invoice_description, unit, price_excl_vat, vat_percentage, price_per, cost_type, id ]
    );

    return res.status(200).json({ success: true, message: 'succes' });

  } catch (err) { 
    console.log(err)
    return res.status(500).json({ success: false, message: 'database error' });
  }
}


// /fetchproducts
async function fetchProductsController(req, res) { 
  let connection;
  const { sessiontoken } = req.body;

  try {
    connection = await connectDB(db);
    let { valid, user_id } = await validateSessionToken(sessiontoken);

    if (sessiontoken == null || valid == false) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }

    let [rows] = await connection.execute(
      "SELECT * FROM PRODUCTS"
    );

    if (rows.length <= 0) {
      return res.status(210).json({ success: true, message: 'No products found' }); // 210 successful but nothing in the db
    }

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


// /fetchproductnames
async function fetchProductNamesController(req, res) { 
  let connection;
  const { sessiontoken } = req.body;

  try {
    connection = await connectDB(db);
    let { valid, user_id } = await validateSessionToken(sessiontoken);

    if (sessiontoken == null || valid == false) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }

    let [rows] = await connection.execute(
      "SELECT name FROM PRODUCTS"
    );

    if (rows.length <= 0) {
      return res.status(210).json({ success: true, message: 'No products found' }); // 210 successful but nothing in the db
    }

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


// /fetchproductsmonthly
async function fetchProductsMonthlyController(req, res) {
  let connection;
  const { sessiontoken } = req.body;

  try {
    connection = await connectDB(db);

    let { valid, user_id } = await validateSessionToken(sessiontoken);

    if (sessiontoken == null || valid == false) {
      return res
        .status(400)
        .json({ success: false, message: "no valid session token" });
    }

    let [rows] = await connection.execute(
      "SELECT * FROM PRODUCTS WHERE price_per = 'maandelijks'"
    );

    if (rows <= 0) {
      return res
        .status(210)
        .json({ success: true, message: "No products found" }); //210 succesfull but nothing in the db
    }

    return res
      .status(200)
      .json({ success: true, message: "Succesfull fetch", data: rows });

  } catch (error) {
    console.log("A database error has occured: " + error);
    return res
      .status(500)
      .json({ success: true, message: "Database error" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
}



module.exports = { createProduct, editProduct, saveProduct, fetchProductsController,  fetchProductNamesController, fetchProductsMonthlyController};
