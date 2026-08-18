import client from "./client.js";

// GET /api/notifications -> { success, count, unread, notifications }
// Pass { unread: true } to fetch only unread notifications.
export async function listNotifications({ unread = false } = {}) {
  const res = await client.get("/notifications", {
    params: unread ? { unread: "true" } : {},
  });
  return res.data;
}

// PATCH /api/notifications/:id/read -> { success, notification }
export async function markNotificationRead(id) {
  const res = await client.patch(`/notifications/${id}/read`);
  return res.data;
}

// PATCH /api/notifications/read-all -> { success, updated }
export async function markAllNotificationsRead() {
  const res = await client.patch("/notifications/read-all");
  return res.data;
}
