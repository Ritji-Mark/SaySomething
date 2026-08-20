const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const { validateDepartmentBelongsToAuthority } = require("../utils/orgValidation");

const router = express.Router();

// Category rows enriched with their routing defaults' display names. Used by
// both the list and the routing-update response so the shape stays identical.
const CATEGORY_SELECT = `
    SELECT
        c.id,
        c.name,
        c.description,
        c.default_authority_id,
        a.name AS default_authority,
        c.default_department_id,
        d.name AS default_department
    FROM categories c
    LEFT JOIN authorities a ON a.id = c.default_authority_id
    LEFT JOIN departments d ON d.id = c.default_department_id
`;

// GET all report categories (reference data for the report form + routing UI)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`${CATEGORY_SELECT} ORDER BY c.id ASC`);

        res.json({
            success: true,
            count: result.rows.length,
            categories: result.rows
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ success: false, message: "Failed to fetch categories" });
    }
});

// PUT /api/categories/:id/routing -> set (or clear) a category's default
// authority + department for auto-assignment (Administrator only).
// Body: { authority_id, department_id } — either may be null/omitted to clear.
router.put(
    "/:id/routing",
    authenticateToken,
    authorizeRoles("Administrator"),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { authority_id, department_id } = req.body;

            const hasAuthority =
                authority_id !== undefined && authority_id !== null && authority_id !== "";
            const hasDepartment =
                department_id !== undefined && department_id !== null && department_id !== "";

            // 1. Category must exist
            const categoryResult = await pool.query(
                "SELECT id FROM categories WHERE id = $1",
                [id]
            );
            if (categoryResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }

            // 2. A department cannot be set without an authority
            if (hasDepartment && !hasAuthority) {
                return res.status(400).json({
                    success: false,
                    message: "A department cannot be set without an authority"
                });
            }

            // 3. If an authority is given, it must exist
            if (hasAuthority) {
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
            }

            // 4. If a department is given, it must exist AND belong to the authority
            if (hasDepartment) {
                const check = await validateDepartmentBelongsToAuthority(
                    pool,
                    department_id,
                    authority_id
                );
                if (!check.ok) {
                    return res.status(check.status).json({
                        success: false,
                        message: check.message
                    });
                }
            }

            // 5. Apply (clearing to NULL when not provided)
            await pool.query(
                `
                UPDATE categories
                SET
                    default_authority_id = $1,
                    default_department_id = $2
                WHERE id = $3
                `,
                [hasAuthority ? authority_id : null, hasDepartment ? department_id : null, id]
            );

            // Return the enriched row so the client can show updated names
            const updated = await pool.query(`${CATEGORY_SELECT} WHERE c.id = $1`, [id]);

            res.json({
                success: true,
                message: "Category routing updated successfully",
                category: updated.rows[0]
            });

        } catch (error) {
            console.error("Error updating category routing:", error);
            res.status(500).json({ success: false, message: "Failed to update category routing" });
        }
    }
);

module.exports = router;
