const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            password
        } = req.body;

        // Validate required fields
        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required"
            });
        }

        // Check if email already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 12);

        // Citizen role = 1
        const role_id = 1;

        // Create user
        const result = await pool.query(
            `
            INSERT INTO users (
                full_name,
                email,
                phone,
                password_hash,
                role_id
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, full_name, email, phone, role_id, created_at
            `,
            [
                full_name,
                email,
                phone || null,
                password_hash,
                role_id
            ]
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to register user"
        });
    }
});


// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user and role
        const result = await pool.query(
            `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.password_hash,
                u.role_id,
                u.authority_id,
                r.name AS role
            FROM users u
            JOIN roles r
                ON u.role_id = r.id
            WHERE u.email = $1
            `,
            [email]
        );

        // Don't reveal whether the email exists
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        // Compare password with stored bcrypt hash
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                user_id: user.id,
                role_id: user.role_id,
                role: user.role,
                authority_id: user.authority_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role_id: user.role_id,
                role: user.role,
                authority_id: user.authority_id
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to login"
        });
    }
});

module.exports = router;