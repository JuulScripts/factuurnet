// db.js
const mysql = require('mysql2/promise'); // note /promise for async/await




async function connectDB(db) {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: db,
            decimalNumbers: true,
              dateStrings: true
        });
        return connection;
    } catch (err) {
        console.error('Error connecting to MySQL', err);
        throw err;
    }
}




module.exports = { connectDB };
