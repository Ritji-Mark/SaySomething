const pool = require("../config/database");

/**
 * Loads a report and determines whether the given authenticated user may
 * access it, using the same visibility rules as the reports routes:
 *   - Administrator  → any report
 *   - Authority      → reports assigned to their authority
 *   - Citizen        → only their own reports
 *
 * Returns { report, allowed }:
 *   - report === null  → report does not exist (caller should 404)
 *   - allowed === false → exists but user may not access it (caller should 403/404)
 */
async function getAccessibleReport(user, reportId) {
    const result = await pool.query(
        `SELECT id, user_id, authority_id, status_id, report_number
         FROM reports
         WHERE id = $1`,
        [reportId]
    );

    if (result.rows.length === 0) {
        return { report: null, allowed: false };
    }

    const report = result.rows[0];
    const { role, user_id, authority_id } = user;

    let allowed = false;
    if (role === "Administrator") {
        allowed = true;
    } else if (role === "Authority") {
        allowed = report.authority_id === authority_id;
    } else if (role === "Citizen") {
        allowed = report.user_id === user_id;
    }

    return { report, allowed };
}

module.exports = { getAccessibleReport };
