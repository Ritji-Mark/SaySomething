const path = require("path");
// Load .env from the project root regardless of the current working directory
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const pool = require("./config/database");

const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/reports");
const commentRoutes = require("./routes/comments");
const evidenceRoutes = require("./routes/evidence");
const notificationRoutes = require("./routes/notifications");
const categoryRoutes = require("./routes/categories");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Serve uploaded evidence files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Nested report sub-resources (mounted before the general reports router)
app.use("/api/reports/:reportId/comments", commentRoutes);
app.use("/api/reports/:reportId/evidence", evidenceRoutes);

app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to SaySomething API"
    });
});

app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Database connection successful",
            databaseTime: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`SaySomething server running on port ${PORT}`);
});
