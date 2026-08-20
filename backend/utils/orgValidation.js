/**
 * Validates that a department exists and belongs to the given authority.
 * Works with either the shared `pool` or a checked-out transaction `client`
 * (both expose `.query`), so it can be reused inside a transaction.
 *
 * Returns { ok, status, message }:
 *   - { ok: true }                          → valid pairing
 *   - { ok: false, status: 404, message }   → department does not exist
 *   - { ok: false, status: 400, message }   → department belongs to another authority
 */
async function validateDepartmentBelongsToAuthority(clientOrPool, departmentId, authorityId) {
    const result = await clientOrPool.query(
        "SELECT id, authority_id FROM departments WHERE id = $1",
        [departmentId]
    );

    if (result.rows.length === 0) {
        return { ok: false, status: 404, message: "Department not found" };
    }

    if (Number(result.rows[0].authority_id) !== Number(authorityId)) {
        return {
            ok: false,
            status: 400,
            message: "Department does not belong to the specified authority"
        };
    }

    return { ok: true };
}

module.exports = { validateDepartmentBelongsToAuthority };
