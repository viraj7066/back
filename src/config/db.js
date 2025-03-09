const mysql = require("mysql2/promise"); // Use mysql2 with promise support
require("dotenv").config(); // Load environment variables

// Debugging: Log database connection details
console.log("🔧 Database Connection Details:");
console.log("   - Host:", process.env.DB_HOST || "Not Set");
console.log("   - User:", process.env.DB_USER || "Not Set");
console.log("   - Password:", process.env.DB_PASSWORD ? "Set" : "Not Set");
console.log("   - Database:", process.env.DB_NAME || "Not Set");
console.log("   - Port:", process.env.DB_PORT || "3306 (Default)");

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "protoform",
  port: process.env.DB_PORT || 3306, // Default MySQL port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export the promise-based pool
module.exports = pool;
