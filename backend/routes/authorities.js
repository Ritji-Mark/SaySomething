const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");

const router = express.Router();

// Columns returned to clients. Kept in one place so the list/create/update
// responses stay identical.
const AUTHORITY_COLUMNS =
    "id, name, description, contact_email, contact_phone, address";

// GET all authorities (reference data for assignment + staff onboarding)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ${AUTHORITY_COLUMNS}
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

// POST /api/authorities -> create an authority (Administrator only)
router.post(
    "/",
    authenticateToken,
    authorizeRoles("Administrator"),
    async (req, res) => {
        try {
            const { name, description, contact_email, contact_phone, address } = req.body;

            if (!name || !String(name).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Authority name is required"
                });
            }

            const result = await pool.query(
                `
                INSERT INTO authorities (name, description, contact_email, contact_phone, address)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING ${AUTHORITY_COLUMNS}
                `,
                [
                    String(name).trim(),
                    description || null,
                    contact_email || null,
                    contact_phone || null,
                    address || null
                ]
            );

            res.status(201).json({
                success: true,
                message: "Authority created successfully",
                authority: result.rows[0]
            });

        } catch (error) {
            console.error("Error creating authority:", error);
            res.status(500).json({ success: false, message: "Failed to create authority" });
        }
    }
);

// PUT /api/authorities/:id -> update an authority (Administrator only)
router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("Administrator"),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, contact_email, contact_phone, address } = req.body;

            if (!name || !String(name).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Authority name is required"
                });
            }

            const result = await pool.query(
                `
                UPDATE authorities
                SET
                    name = $1,
                    description = $2,
                    contact_email = $3,
                    contact_phone = $4,
                    address = $5
                WHERE id = $6
                RETURNING ${AUTHORITY_COLUMNS}
                `,
                [
                    String(name).trim(),
                    description || null,
                    contact_email || null,
                    contact_phone || null,
                    address || null,
                    id
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Authority not found"
                });
            }

            res.json({
                success: true,
                message: "Authority updated successfully",
                authority: result.rows[0]
            });

        } catch (error) {
            console.error("Error updating authority:", error);
            res.status(500).json({ success: false, message: "Failed to update authority" });
        }
    }
);

module.exports = router;
