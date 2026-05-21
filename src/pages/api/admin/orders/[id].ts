import type { APIRoute } from "astro";
import { db, Orders, User, eq } from "astro:db";
import { requireAdmin } from "@/lib/admin-auth";

export const GET: APIRoute = async ({ request, params }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = params;
  if (!id) return Response.json({ error: "ID mancante." }, { status: 400 });

  const [order] = await db.select().from(Orders).where(eq(Orders.id, id));
  if (!order) return Response.json({ error: "Ordine non trovato." }, { status: 404 });

  let email = order.guestEmail ?? null;
  if (order.userId) {
    const [user] = await db.select().from(User).where(eq(User.id, order.userId));
    email = user?.email ?? null;
  }

  return Response.json({ ...order, email });
};
