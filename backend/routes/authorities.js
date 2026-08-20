const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// GET all authorities (reference data for assignment + staff onboarding)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description, contact_email, contact_phone, address
             FROM authorities
             ORDER BY name ASC`
        );

        res.json({
            success: true,
            count: result.rows.length,
            authorities: result.rows
        });

    } catch (error) {
        console.error("Error fetching authorities:", error);
        res.status(500).json({ success: false, message: "Failed to fetch authorities" });
    }
});

module.exports = router;
