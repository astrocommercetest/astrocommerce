import type { APIRoute } from "astro";
import { db, Brands, isNull } from "astro:db";
import { requireAdmin } from "@/lib/admin-auth";

export const GET: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const brands = await db.select().from(Brands).where(isNull(Brands.deletedAt));
  return Response.json(brands);
};
