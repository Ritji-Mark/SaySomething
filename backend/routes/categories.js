const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// GET all report categories (reference data for the report form)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, description FROM categories ORDER BY id ASC"
        );

        res.json({
            success: true,
            count: result.rows.length,
            categories: result.rows
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ success: false, message: "Failed to fetch categories" });
    }
});

module.exports = router;
