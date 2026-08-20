const path = require("path");
const { Pool } = require("pg");
// Load .env from the project root regardless of the current working directory
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Managed Postgres (e.g. Supabase) requires SSL. Enable it in production
    // with DB_SSL=true; left off locally so a plain local Postgres still works.
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

pool.on("connect", () => {
    console.log("Connected to PostgreSQL");
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error);
});

module.exports = pool;