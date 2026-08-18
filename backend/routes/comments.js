const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");
const { getAccessibleReport } = require("../utils/reportAccess");

// mergeParams lets this router read :reportId from the parent mount path
const router = express.Router({ mergeParams: true });

// GET all comments for a report
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { reportId } = req.params;

        const { report, allowed } = await getAccessibleReport(req.user, reportId);

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to view this report"
            });
        }

        const result = await pool.query(
            `
            SELECT
                cm.id,
                cm.comment,
                cm.created_at,
                cm.user_id,
                u.full_name AS author
            FROM comments cm
            LEFT JOIN users u ON u.id = cm.user_id
            WHERE cm.report_id = $1
            ORDER BY cm.created_at ASC
            `,
            [reportId]
        );

        res.json({
            success: true,
            count: result.rows.length,
            comments: result.rows
        });

    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ success: false, message: "Failed to fetch comments" });
    }
});

// POST a new comment on a report
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { reportId } = req.params;
        const { comment } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: "comment is required"
            });
        }

        const { report, allowed } = await getAccessibleReport(req.user, reportId);

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to comment on this report"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO comments (report_id, user_id, comment)
            VALUES ($1, $2, $3)
            RETURNING id, report_id, user_id, comment, created_at
            `,
            [reportId, req.user.user_id, comment.trim()]
        );

        // Notify the reporter when someone else comments on their report
        if (report.user_id !== req.user.user_id) {
            await pool.query(
                `
                INSERT INTO notifications (user_id, report_id, title, message)
                VALUES ($1, $2, $3, $4)
                `,
                [
                    report.user_id,
                    reportId,
                    "New comment on your report",
                    `There is a new comment on report ${report.report_number}.`
                ]
            );
        }

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comment: result.rows[0]
        });

    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ success: false, message: "Failed to add comment" });
    }
});

module.exports = router;
