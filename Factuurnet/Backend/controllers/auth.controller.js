const { connectDB } = require('../Modules/DB_handler');
const { validateArgon2, createSHA256, createSessionToken } = require('../Modules/Hashing');

const db = "invoicewebsite";
//adminlogin
async function loginController(req, res) {
    let connection;
    let username = req.body.username;
    let password = req.body.password;
    let sessiontoken = req.body.sessiontoken;

    try {
        connection = await connectDB(db);

        if (sessiontoken != null) {
            let hashedSesh = createSHA256(sessiontoken);
            let [rows] = await connection.execute(
                "SELECT token FROM sessions WHERE token = ?",
                [hashedSesh]
            );

            if (rows.length > 0) {
                return res.status(200).json({ success: true, message: 'valid', sessiontoken: sessiontoken });
            }
        }

        let [rows] = await connection.execute(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (rows.length <= 0) {
            return res.status(401).json({ success: false, message: 'user not found' });
        }

        let user = rows[0];

        if (await validateArgon2(user.password, password) == false) {
            return res.status(401).json({ success: false, message: 'wrong password' });
        }

        let sesh = createSessionToken();
        let hashedsesh = createSHA256(sesh);

        await connection.execute(
            "INSERT INTO `sessions` (token, user_id, user_username, expires_at) VALUES (?, ?, ?, ?)",
            [hashedsesh, user.id, user.username, new Date()]
        );

        return res.status(200).json({ success: true, message: "succesfull login + sessiontoken", sessiontoken: sesh });

    } catch (err) {
        console.log("error connecting to database error: " + err);
        return res.status(400).json({ success: false, message: 'database error' });
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

// dashboardverify
async function sessionCheckController(req, res) {
    let connection;
    let sessiontoken = req.body.sessiontoken;
    let hashsesh = createSHA256(sessiontoken);

    try {
        connection = await connectDB(db);
        let [rows] = await connection.execute(
            "SELECT token FROM sessions WHERE token = ?",
            [hashsesh]
        );

        if (rows.length <= 0) {
            return res.status(401).json({ success: false, message: 'not a valid sessiontoken' });
        }

        return res.status(200).json({ success: true, redirectUrl: "/invoiceselect" });

    } catch (err) {
        console.log("database error" + err);
        return res.status(400).json({ success: false, message: 'database error' });
    } finally {
        if (connection) {
            connection.end();
        }
    }
}


async function deleteSessionToken(req, res) {
    let {sessiontoken} = req.body 
    
    let connection
    let hashsesh = createSHA256(sessiontoken);

    try {
        connection = await connectDB(db)
        let [rows] = await connection.execute(
            "SELECT * FROM sessions WHERE token = ?", 
            [hashsesh]
        )


        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'not a valid sessiontoken' });
        }


        let [deleteRows] = await connection.execute(
            "DELETE FROM sessions WHERE token = ?",
            [hashsesh]
        )

          if (deleteRows.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'something wen wrong whilst logging out' });
        }

         
            return res.status(200).json({ success: true, message: 'Logged out succesfully' });
         
    } catch(err) { 
        console.log(err)
            return res.status(500).json({ success: false, message: 'server error' });
    } finally {
        if (connection) {
            connection.end()
        }
    }
}


module.exports = { loginController, sessionCheckController, deleteSessionToken };



