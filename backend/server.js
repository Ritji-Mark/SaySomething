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
const authorityRoutes = require("./routes/authorities");
const departmentRoutes = require("./routes/departments");
const reportStatusRoutes = require("./routes/reportStatuses");
const userRoutes = require("./routes/users");

const app = express();

// CORS: in production, lock to CLIENT_ORIGIN. In development, accept any
// localhost / 127.0.0.1 origin so the exact Vite port (5173, 5174, …) doesn't
// matter — Vite drifts to the next free port when 5173 is taken.
const isProd = process.env.NODE_ENV === "production";
const allowedOrigin = process.env.CLIENT_ORIGIN;
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (curl, health checks) send no Origin header.
      if (!origin) return callback(null, true);
      // Explicit allow-list via env (e.g. the production domain).
      if (allowedOrigin && origin === allowedOrigin) return callback(null, true);
      // Any localhost / 127.0.0.1 origin during development.
      if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
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
app.use("/api/authorities", authorityRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/report-statuses", reportStatusRoutes);
app.use("/api/users", userRoutes);

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
