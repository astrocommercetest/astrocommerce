import type { APIRoute } from "astro";
import { db, Activities } from "astro:db";
import { requireAdmin } from "@/lib/admin-auth";

export const GET: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const activities = await db.select().from(Activities);
  return Response.json(activities);
};

export const POST: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: { id: string; label: string };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }

  const { id, label } = body;
  if (!id || !label) return Response.json({ error: "id e label obbligatori." }, { status: 400 });

  await db.insert(Activities).values({ id, label });
  return Response.json({ id }, { status: 201 });
};
