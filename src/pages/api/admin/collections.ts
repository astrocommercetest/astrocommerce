import type { APIRoute } from "astro";
import { db, Collections } from "astro:db";
import { requireAdmin } from "@/lib/admin-auth";

export const GET: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const collections = await db.select().from(Collections);
  return Response.json(collections);
};
