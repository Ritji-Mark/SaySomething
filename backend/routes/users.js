const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");

const router = express.Router();

// Every route in this file is Administrator-only. This is the privileged
// account-management surface: creating staff (Authority / Administrator)
// accounts and binding an Authority user to their organization.

// GET /api/users -> list accounts (never expose password hashes)
router.get(
    "/",
    authenticateToken,
    authorizeRoles("Administrator"),
    async (req, res) => {
        try {
            const result = await pool.query(
                `
                SELECT
                    u.id,
                    u.full_name,
                    u.email,
                    u.phone,
                    u.role_id,
                    r.name AS role,
                    u.authority_id,
                    a.name AS authority,
                    u.created_at
                FROM users u
                JOIN roles r ON r.id = u.role_id
                LEFT JOIN authorities a ON a.id = u.authority_id
                ORDER BY u.created_at DESC
                `
            );

            res.json({
                success: true,
                count: result.rows.length,
                users: result.rows
            });

        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ success: false, message: "Failed to fetch users" });
        }
    }
);

// POST /api/users -> create an Authority or Administrator account
router.post(
    "/",
    authenticateToken,
    authorizeRoles("Administrator"),
    async (req, res) => {
        try {
            const { full_name, email, phone, password, role_id, authority_id } = req.body;

            // 1. Required fields
            if (!full_name || !email || !password || role_id === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Full name, email, password and role_id are required"
                });
            }

            // 2. Password strength (mirror the citizen minimum)
            if (String(password).length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }

            // 3. Only staff roles may be created here (Authority = 2, Administrator = 3).
            //    Citizens self-register via /api/auth/register.
            const roleIdNum = Number(role_id);
            if (![2, 3].includes(roleIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: "role_id must be 2 (Authority) or 3 (Administrator)"
                });
            }

            // 4. Authority accounts must be bound to a real authority; Admins never are.
            let boundAuthorityId = null;
            if (roleIdNum === 2) {
                if (!authority_id) {
                    return res.status(400).json({
                        success: false,
                        message: "authority_id is required for Authority accounts"
                    });
                }
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
                boundAuthorityId = Number(authority_id);
            }

            // 5. Email must be free
            const existing = await pool.query(
                "SELECT id FROM users WHERE email = $1",
                [email]
            );
            if (existing.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered"
                });
            }

            // 6. Hash + insert
            const password_hash = await bcrypt.hash(password, 12);

            const result = await pool.query(
                `
                INSERT INTO users (full_name, email, phone, password_hash, role_id, authority_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, full_name, email, phone, role_id, authority_id, created_at
                `,
                [full_name, email, phone || null, password_hash, roleIdNum, boundAuthorityId]
            );

            res.status(201).json({
                success: true,
                message: "User created successfully",
                user: result.rows[0]
            });

        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).json({ success: false, message: "Failed to create user" });
        }
    }
);

module.exports = router;
