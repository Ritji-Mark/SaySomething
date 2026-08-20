const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");

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

// POST /api/departments -> create a department under an authority (Administrator only)
router.post(
    "/",
    authenticateToken,
    authorizeRoles("Administrator"),
    async (req, res) => {
        try {
            const { authority_id, name, description } = req.body;

            if (!authority_id || !name || !String(name).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "authority_id and name are required"
                });
            }

            // The parent authority must exist.
            const authResult = await pool.query(
                "SELECT id FROM authorities WHERE id = $1",
                [authority_id]
            );
            if (authResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Authority not found"
                });
            }

            const result = await pool.query(
                `
                INSERT INTO departments (authority_id, name, description)
                VALUES ($1, $2, $3)
                RETURNING id, authority_id, name, description
                `,
                [authority_id, String(name).trim(), description || null]
            );

            res.status(201).json({
                success: true,
                message: "Department created successfully",
                department: result.rows[0]
            });

        } catch (error) {
            console.error("Error creating department:", error);
            res.status(500).json({ success: false, message: "Failed to create department" });
        }
    }
);

module.exports = router;
