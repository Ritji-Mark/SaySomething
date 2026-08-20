const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// GET departments (optionally filtered by ?authority_id=)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { authority_id } = req.query;

        let query = "SELECT id, authority_id, name, description FROM departments";
        const values = [];

        if (authority_id !== undefined && authority_id !== "") {
            values.push(authority_id);
            query += ` WHERE authority_id = $${values.length}`;
        }

        query += " ORDER BY name ASC";

        const result = await pool.query(query, values);

        res.json({
            success: true,
            count: result.rows.length,
            departments: result.rows
        });

    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({ success: false, message: "Failed to fetch departments" });
    }
});

module.exports = router;
