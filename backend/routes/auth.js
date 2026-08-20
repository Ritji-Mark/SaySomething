const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { OAuth2Client } = require("google-auth-library");
const { sendMail } = require("../services/mailer");
const { passwordResetEmail } = require("../services/emailTemplates");

const router = express.Router();

// SHA-256 hex digest — we store only the hash of a reset token, never the token.
const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

// Reused to verify Google ID tokens. The audience (our client ID) is passed
// per-call from the environment, so this works even if the env loads late.
const googleClient = new OAuth2Client();

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
                u.avatar_url,
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

        // Google-only accounts have no password to compare against.
        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                message: "This account uses Google sign-in. Please continue with Google."
            });
        }

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
                authority_id: user.authority_id,
                avatar_url: user.avatar_url
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

// GOOGLE SIGN-IN
// Verifies a Google ID token (from the "Sign in with Google" button), then
// finds/links/creates the user and issues our own app JWT.
router.post("/google", async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required"
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(503).json({
                success: false,
                message: "Google sign-in is not configured"
            });
        }

        // Verify the token was minted by Google for THIS app (audience check).
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch {
            return res.status(401).json({
                success: false,
                message: "Invalid Google credential"
            });
        }

        if (!payload || !payload.email || !payload.email_verified) {
            return res.status(401).json({
                success: false,
                message: "Google account email is not verified"
            });
        }

        const googleId = payload.sub;
        const email = payload.email;
        const fullName = payload.name || email;
        const avatarUrl = payload.picture || null;

        // 1) Known Google user -> refresh avatar.
        // 2) Existing email account -> link the Google identity (verified email).
        // 3) Otherwise -> create a new Citizen (no password).
        let userId;

        const byGoogle = await pool.query(
            "SELECT id FROM users WHERE google_id = $1",
            [googleId]
        );

        if (byGoogle.rows.length > 0) {
            const updated = await pool.query(
                `UPDATE users
                 SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE google_id = $2
                 RETURNING id`,
                [avatarUrl, googleId]
            );
            userId = updated.rows[0].id;
        } else {
            const byEmail = await pool.query(
                "SELECT id FROM users WHERE email = $1",
                [email]
            );

            if (byEmail.rows.length > 0) {
                const linked = await pool.query(
                    `UPDATE users
                     SET google_id = $1,
                         avatar_url = COALESCE(avatar_url, $2),
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $3
                     RETURNING id`,
                    [googleId, avatarUrl, byEmail.rows[0].id]
                );
                userId = linked.rows[0].id;
            } else {
                const created = await pool.query(
                    `INSERT INTO users (full_name, email, google_id, avatar_url, role_id)
                     VALUES ($1, $2, $3, $4, 1)
                     RETURNING id`,
                    [fullName, email, googleId, avatarUrl]
                );
                userId = created.rows[0].id;
            }
        }

        // Load the full user + role name for the token and response.
        const result = await pool.query(
            `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.role_id,
                u.authority_id,
                u.avatar_url,
                r.name AS role
            FROM users u
            JOIN roles r
                ON u.role_id = r.id
            WHERE u.id = $1
            `,
            [userId]
        );

        const user = result.rows[0];

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
                authority_id: user.authority_id,
                avatar_url: user.avatar_url
            }
        });

    } catch (error) {
        console.error("Google sign-in error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to sign in with Google"
        });
    }
});

// FORGOT PASSWORD
// Always responds success (no email enumeration). If the email matches an
// account, mint a single-use token, store only its hash, and email the link.
router.post("/forgot-password", async (req, res) => {
    // Generic reply used in every branch so callers can't probe for accounts.
    const genericResponse = {
        success: true,
        message: "If an account exists, a reset link has been sent."
    };

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const userResult = await pool.query(
            "SELECT id, full_name FROM users WHERE email = $1",
            [email]
        );

        // Unknown email → same generic response, no work done.
        if (userResult.rows.length === 0) {
            return res.json(genericResponse);
        }

        const user = userResult.rows[0];

        // Raw token goes in the email link; only its hash is persisted.
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            `INSERT INTO password_resets (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, tokenHash, expiresAt]
        );

        const appOrigin = process.env.APP_ORIGIN || "http://localhost:5173";
        const resetUrl = `${appOrigin}/reset-password?token=${token}`;

        const mail = passwordResetEmail({ name: user.full_name, resetUrl });
        // Fire-and-forget: don't leak send success/failure into the response.
        sendMail({ to: email, ...mail });

        return res.json(genericResponse);

    } catch (error) {
        console.error("Forgot-password error:", error);
        // Still generic — don't expose internals on the recovery path.
        return res.json(genericResponse);
    }
});

// RESET PASSWORD
// Consumes a valid, unexpired, unused token and sets a new password.
// Invalid/expired → 400 (NOT 401, which the client interceptor would treat as
// a session expiry and redirect to /login).
router.post("/reset-password", async (req, res) => {
    const client = await pool.connect();
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const tokenHash = hashToken(token);

        await client.query("BEGIN");

        // Lock the row so a token can't be redeemed twice concurrently.
        const resetResult = await client.query(
            `SELECT id, user_id
             FROM password_resets
             WHERE token_hash = $1
               AND used_at IS NULL
               AND expires_at > now()
             FOR UPDATE`,
            [tokenHash]
        );

        if (resetResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "This reset link is invalid or has expired."
            });
        }

        const resetRow = resetResult.rows[0];
        const password_hash = await bcrypt.hash(password, 12);

        await client.query(
            `UPDATE users
             SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [password_hash, resetRow.user_id]
        );

        // Single-use: burn this token now.
        await client.query(
            "UPDATE password_resets SET used_at = now() WHERE id = $1",
            [resetRow.id]
        );

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: "Your password has been reset. You can now sign in."
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Reset-password error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reset password"
        });
    } finally {
        client.release();
    }
});

module.exports = router;