const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// GET all report statuses (reference data for the status-change UI)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, description FROM report_status ORDER BY id ASC"
        );

        res.json({
            success: true,
            count: result.rows.length,
            statuses: result.rows
        });

    } catch (error) {
        console.error("Error fetching report statuses:", error);
        res.status(500).json({ success: false, message: "Failed to fetch report statuses" });
    }
});

module.exports = router;
