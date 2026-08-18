const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// GET current user's notifications (newest first). ?unread=true filters to unread.
router.get("/", authenticateToken, async (req, res) => {
    try {
        const onlyUnread = req.query.unread === "true";

        const query = `
            SELECT id, report_id, title, message, is_read, created_at
            FROM notifications
            WHERE user_id = $1
            ${onlyUnread ? "AND is_read = FALSE" : ""}
            ORDER BY created_at DESC
        `;

        const result = await pool.query(query, [req.user.user_id]);

        const unreadCount = result.rows.filter((n) => !n.is_read).length;

        res.json({
            success: true,
            count: result.rows.length,
            unread: onlyUnread ? result.rows.length : unreadCount,
            notifications: result.rows
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
});

// PATCH mark all of the current user's notifications as read
router.patch("/read-all", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = $1 AND is_read = FALSE`,
            [req.user.user_id]
        );

        res.json({
            success: true,
            message: "All notifications marked as read",
            updated: result.rowCount
        });

    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ success: false, message: "Failed to update notifications" });
    }
});

// PATCH mark a single notification as read (must belong to the user)
router.patch("/:id/read", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE id = $1 AND user_id = $2
             RETURNING id, report_id, title, message, is_read, created_at`,
            [id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.json({
            success: true,
            message: "Notification marked as read",
            notification: result.rows[0]
        });

    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ success: false, message: "Failed to update notification" });
    }
});

module.exports = router;
