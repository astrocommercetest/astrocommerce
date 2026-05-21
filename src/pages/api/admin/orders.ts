import type { APIRoute } from "astro";
import { db, Orders, User, eq } from "astro:db";
import { requireAdmin } from "@/lib/admin-auth";

export const GET: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const rows = await db
    .select({
      id: Orders.id,
      status: Orders.status,
      subtotal: Orders.subtotal,
      items: Orders.items,
      shippingName: Orders.shippingName,
      guestEmail: Orders.guestEmail,
      userId: Orders.userId,
      paidAt: Orders.paidAt,
      createdAt: Orders.createdAt,
    })
    .from(Orders)
    .orderBy(Orders.createdAt);

  // Enrich with user email for registered users
  const userIds = rows.map((r) => r.userId).filter(Boolean) as string[];
  const emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const users = await db.select().from(User);
    for (const u of users) emailMap[u.id] = u.email;
  }

  return Response.json(
    rows.map((r) => ({
      ...r,
      email: r.userId ? (emailMap[r.userId] ?? null) : r.guestEmail,
      itemCount: Array.isArray(r.items) ? r.items.length : 0,
    })).reverse(), // most recent first
  );
};
