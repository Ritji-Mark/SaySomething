// Role names as returned by the backend (roles table: 1 Citizen, 2 Authority,
// 3 Administrator). Used for role-aware routing and navigation.
export const ROLES = {
  CITIZEN: "Citizen",
  AUTHORITY: "Authority",
  ADMINISTRATOR: "Administrator",
};

export const STAFF_ROLES = [ROLES.AUTHORITY, ROLES.ADMINISTRATOR];

export function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

// Where a user should land after login, and where they're bounced to if they
// hit a route their role can't access.
export function homePathForRole(role) {
  return isStaff(role) ? "/dashboard" : "/reports";
}
