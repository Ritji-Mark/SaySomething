const express = require("express");
const crypto = require("crypto");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const { getAccessibleReport } = require("../utils/reportAccess");
const { sendMail } = require("../services/mailer");
const {
    statusChangedEmail,
    reportAssignedEmail,
} = require("../services/emailTemplates");

const router = express.Router();

// Shared SELECT for report listings / detail
const REPORT_SELECT = `
    SELECT
        r.id,
        r.report_number,
        r.title,
        r.description,
        r.address,
        r.status_id,
        rs.name AS status,
        r.category_id,
        c.name AS category,
        r.user_id,
        u.full_name AS reporter_name,
        r.authority_id,
        a.name AS authority,
        r.department_id,
        d.name AS department,
        r.created_at,
        r.updated_at,
        r.resolved_at,
        ST_Y(r.location::geometry) AS latitude,
        ST_X(r.location::geometry) AS longitude
    FROM reports r
    LEFT JOIN report_status rs ON rs.id = r.status_id
    LEFT JOIN categories c ON c.id = r.category_id
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN authorities a ON a.id = r.authority_id
    LEFT JOIN departments d ON d.id = r.department_id
`;

// GET all reports (scoped by role)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { user_id, role, authority_id } = req.user;

        let where = "";
        let values = [];

        // Administrator → every report; Authority → their authority; Citizen → own
        if (role === "Administrator") {
            where = "";
        } else if (role === "Authority") {
            where = "WHERE r.authority_id = $1";
            values = [authority_id];
        } else if (role === "Citizen") {
            where = "WHERE r.user_id = $1";
            values = [user_id];
        } else {
            return res.status(403).json({
                success: false,
                message: "Invalid user role"
            });
        }

        const query = `${REPORT_SELECT} ${where} ORDER BY r.created_at DESC`;
        const result = await pool.query(query, values);

        res.json({
            success: true,
            count: result.rows.length,
            reports: result.rows
        });

    } catch (error) {
        console.error("Error fetching reports:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch reports"
        });
    }
});

// GET a single report by ID (scoped by role)
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, role, authority_id } = req.user;

        const result = await pool.query(
            `${REPORT_SELECT} WHERE r.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        const report = result.rows[0];

        // Enforce visibility
        const canView =
            role === "Administrator" ||
            (role === "Authority" && report.authority_id === authority_id) ||
            (role === "Citizen" && report.user_id === user_id);

        if (!canView) {
            return res.status(404).json({
                success: false,
                message: "Report not found or you do not have permission to view it"
            });
        }

        res.json({
            success: true,
            report
        });

    } catch (error) {
        console.error("Error fetching report:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch report"
        });
    }
});

// POST a new report (authenticated; reporter is taken from the token)
router.post("/", authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const {
            category_id,
            title,
            description,
            latitude,
            longitude,
            address
        } = req.body;

        // 1. Validate required fields
        if (!category_id || !title || !description) {
            return res.status(400).json({
                success: false,
                message: "category_id, title and description are required"
            });
        }

        // 2. Validate coordinates
        if (
            latitude === undefined ||
            longitude === undefined ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid latitude and longitude are required"
            });
        }

        // 3. Check that the category exists
        const categoryResult = await pool.query(
            "SELECT id FROM categories WHERE id = $1",
            [category_id]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // 4. Get the Submitted status
        const statusResult = await pool.query(
            "SELECT id FROM report_status WHERE name = 'Submitted'"
        );

        if (statusResult.rows.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Submitted report status is not configured"
            });
        }

        const status_id = statusResult.rows[0].id;

        // 5. Generate a unique report number
        const randomCode = crypto.randomBytes(4).toString("hex").toUpperCase();
        const report_number = `SS-${new Date().getFullYear()}-${randomCode}`;

        // 6. Insert the report
        const result = await pool.query(
            `
            INSERT INTO reports (
                report_number,
                user_id,
                category_id,
                title,
                description,
                location,
                address,
                status_id
            )
            VALUES (
                $1, $2, $3, $4, $5,
                ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
                $8, $9
            )
            RETURNING
                id, report_number, user_id, category_id,
                title, description, address, status_id, created_at
            `,
            [
                report_number,
                user_id,
                category_id,
                title,
                description,
                longitude,
                latitude,
                address || null,
                status_id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            report: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating report:", error);

        res.status(500).json({
            success: false,
            message: "Failed to submit report"
        });
    }
});

// UPDATE report status + record status history + notify the reporter
router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRoles("Authority", "Administrator"),
    async (req, res) => {
        const client = await pool.connect();

        try {
            const { id } = req.params;
            const { status_id, note } = req.body;

            if (!status_id) {
                return res.status(400).json({
                    success: false,
                    message: "status_id is required"
                });
            }

            await client.query("BEGIN");

            // Check report (and grab the reporter for the notification + email)
            const reportResult = await client.query(
                `SELECT r.id, r.status_id, r.user_id, r.report_number,
                        u.email AS reporter_email, u.full_name AS reporter_name
                 FROM reports r
                 JOIN users u ON u.id = r.user_id
                 WHERE r.id = $1`,
                [id]
            );

            if (reportResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }

            const report = reportResult.rows[0];

            // Check status
            const statusResult = await client.query(
                "SELECT id, name FROM report_status WHERE id = $1",
                [status_id]
            );

            if (statusResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    success: false,
                    message: "Status not found"
                });
            }

            const statusName = statusResult.rows[0].name;

            // Update report
            const updatedReport = await client.query(
                `
                UPDATE reports
                SET
                    status_id = $1,
                    updated_at = CURRENT_TIMESTAMP,
                    resolved_at = CASE
                        WHEN $1 = (SELECT id FROM report_status WHERE name = 'Resolved')
                        THEN CURRENT_TIMESTAMP
                        ELSE NULL
                    END
                WHERE id = $2
                RETURNING id, report_number, title, status_id, updated_at, resolved_at
                `,
                [status_id, id]
            );

            // Record status history
            await client.query(
                `
                INSERT INTO status_history (report_id, status_id, changed_by, note)
                VALUES ($1, $2, $3, $4)
                `,
                [id, status_id, req.user.user_id, note || null]
            );

            // Notify the reporter of the status change
            await client.query(
                `
                INSERT INTO notifications (user_id, report_id, title, message)
                VALUES ($1, $2, $3, $4)
                `,
                [
                    report.user_id,
                    id,
                    "Report status updated",
                    `Your report ${report.report_number} is now "${statusName}".`
                ]
            );

            await client.query("COMMIT");

            // Email the reporter (outside the transaction; a mail failure must
            // never roll back the status change). sendMail swallows its errors.
            if (report.reporter_email) {
                const mail = statusChangedEmail({
                    name: report.reporter_name,
                    reportNumber: report.report_number,
                    statusName,
                    reportId: id
                });
                sendMail({ to: report.reporter_email, ...mail });
            }

            res.json({
                success: true,
                message: "Report status updated successfully",
                report: updatedReport.rows[0]
            });

        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Error updating report status:", error);

            res.status(500).json({
                success: false,
                message: "Failed to update report status"
            });

        } finally {
            client.release();
        }
    }
);

// ASSIGN a report to an authority (+ optional department) — Administrator only
router.patch(
    "/:id/assign",
    authenticateToken,
    authorizeRoles("Administrator"),
    async (req, res) => {
        const client = await pool.connect();

        try {
            const { id } = req.params;
            const { authority_id, department_id, note } = req.body;

            if (!authority_id) {
                return res.status(400).json({
                    success: false,
                    message: "authority_id is required"
                });
            }

            await client.query("BEGIN");

            // Report must exist (grab reporter for the notification + email)
            const reportResult = await client.query(
                `SELECT r.id, r.user_id, r.report_number,
                        u.email AS reporter_email, u.full_name AS reporter_name
                 FROM reports r
                 JOIN users u ON u.id = r.user_id
                 WHERE r.id = $1`,
                [id]
            );
            if (reportResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ success: false, message: "Report not found" });
            }
            const report = reportResult.rows[0];

            // Authority must exist
            const authorityResult = await client.query(
                "SELECT id, name FROM authorities WHERE id = $1",
                [authority_id]
            );
            if (authorityResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ success: false, message: "Authority not found" });
            }
            const authorityName = authorityResult.rows[0].name;

            // If a department is given, it must exist AND belong to the authority
            if (department_id !== undefined && department_id !== null) {
                const deptResult = await client.query(
                    "SELECT id, authority_id FROM departments WHERE id = $1",
                    [department_id]
                );
                if (deptResult.rows.length === 0) {
                    await client.query("ROLLBACK");
                    return res.status(404).json({ success: false, message: "Department not found" });
                }
                if (Number(deptResult.rows[0].authority_id) !== Number(authority_id)) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({
                        success: false,
                        message: "Department does not belong to the specified authority"
                    });
                }
            }

            // Move the report to "Assigned"
            const statusResult = await client.query(
                "SELECT id FROM report_status WHERE name = 'Assigned'"
            );
            if (statusResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(500).json({
                    success: false,
                    message: "Assigned report status is not configured"
                });
            }
            const assignedStatusId = statusResult.rows[0].id;

            const updatedReport = await client.query(
                `
                UPDATE reports
                SET
                    authority_id = $1,
                    department_id = $2,
                    status_id = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING id, report_number, title, status_id, authority_id, department_id, updated_at
                `,
                [authority_id, department_id || null, assignedStatusId, id]
            );

            // Record status history
            await client.query(
                `
                INSERT INTO status_history (report_id, status_id, changed_by, note)
                VALUES ($1, $2, $3, $4)
                `,
                [id, assignedStatusId, req.user.user_id, note || `Assigned to ${authorityName}`]
            );

            // Notify the reporter
            await client.query(
                `
                INSERT INTO notifications (user_id, report_id, title, message)
                VALUES ($1, $2, $3, $4)
                `,
                [
                    report.user_id,
                    id,
                    "Report assigned",
                    `Your report ${report.report_number} has been assigned to ${authorityName}.`
                ]
            );

            await client.query("COMMIT");

            // Email the reporter (outside the transaction). sendMail swallows its errors.
            if (report.reporter_email) {
                const mail = reportAssignedEmail({
                    name: report.reporter_name,
                    reportNumber: report.report_number,
                    authorityName,
                    reportId: id
                });
                sendMail({ to: report.reporter_email, ...mail });
            }

            res.json({
                success: true,
                message: "Report assigned successfully",
                report: updatedReport.rows[0]
            });

        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Error assigning report:", error);
            res.status(500).json({ success: false, message: "Failed to assign report" });
        } finally {
            client.release();
        }
    }
);

// GET status history (timeline) for a report — access-checked
router.get("/:id/history", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { report, allowed } = await getAccessibleReport(req.user, id);
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
                sh.id,
                sh.status_id,
                rs.name AS status,
                sh.note,
                sh.changed_by,
                u.full_name AS changed_by_name,
                sh.created_at
            FROM status_history sh
            LEFT JOIN report_status rs ON rs.id = sh.status_id
            LEFT JOIN users u ON u.id = sh.changed_by
            WHERE sh.report_id = $1
            ORDER BY sh.created_at ASC
            `,
            [id]
        );

        res.json({
            success: true,
            count: result.rows.length,
            history: result.rows
        });

    } catch (error) {
        console.error("Error fetching report history:", error);
        res.status(500).json({ success: false, message: "Failed to fetch report history" });
    }
});

module.exports = router;
