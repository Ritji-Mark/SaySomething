const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");
const { getAccessibleReport } = require("../utils/reportAccess");

const router = express.Router({ mergeParams: true });

// Ensure the uploads directory exists (backend/uploads)
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf"
]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const unique = crypto.randomBytes(8).toString("hex");
        cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type"));
        }
    }
});

// Load the report and enforce access BEFORE any file is written to disk
async function ensureReportAccess(req, res, next) {
    try {
        const { report, allowed } = await getAccessibleReport(req.user, req.params.reportId);

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this report"
            });
        }

        req.report = report;
        next();
    } catch (error) {
        console.error("Error checking report access:", error);
        res.status(500).json({ success: false, message: "Failed to verify report access" });
    }
}

// Run multer and translate its errors into JSON responses
function handleUpload(req, res, next) {
    upload.single("file")(req, res, (err) => {
        if (err) {
            const message =
                err.code === "LIMIT_FILE_SIZE"
                    ? "File is too large (max 10 MB)"
                    : err.message || "File upload failed";
            return res.status(400).json({ success: false, message });
        }
        next();
    });
}

// GET all evidence for a report
router.get("/", authenticateToken, ensureReportAccess, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                e.id,
                e.file_url,
                e.file_type,
                e.uploaded_by,
                u.full_name AS uploaded_by_name,
                e.created_at
            FROM evidence e
            LEFT JOIN users u ON u.id = e.uploaded_by
            WHERE e.report_id = $1
            ORDER BY e.created_at ASC
            `,
            [req.params.reportId]
        );

        res.json({
            success: true,
            count: result.rows.length,
            evidence: result.rows
        });

    } catch (error) {
        console.error("Error fetching evidence:", error);
        res.status(500).json({ success: false, message: "Failed to fetch evidence" });
    }
});

// POST (upload) evidence for a report
router.post("/", authenticateToken, ensureReportAccess, handleUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "A file is required (form field name: 'file')"
            });
        }

        const file_url = `/uploads/${req.file.filename}`;

        const result = await pool.query(
            `
            INSERT INTO evidence (report_id, file_url, file_type, uploaded_by)
            VALUES ($1, $2, $3, $4)
            RETURNING id, report_id, file_url, file_type, uploaded_by, created_at
            `,
            [req.params.reportId, file_url, req.file.mimetype, req.user.user_id]
        );

        res.status(201).json({
            success: true,
            message: "Evidence uploaded successfully",
            evidence: result.rows[0]
        });

    } catch (error) {
        console.error("Error uploading evidence:", error);
        res.status(500).json({ success: false, message: "Failed to upload evidence" });
    }
});

module.exports = router;
