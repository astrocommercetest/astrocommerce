import type { APIRoute } from "astro";
import { db, Products, eq } from "astro:db";
import { requireAdmin } from "@/lib/admin-auth";

export const GET: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const excludeId = url.searchParams.get("excludeId");

  if (!slug) return Response.json({ error: "Slug mancante." }, { status: 400 });

  const rows = await db.select({ id: Products.id }).from(Products).where(eq(Products.slug, slug));
  const conflict = rows.find((r) => r.id !== excludeId);

  return Response.json({ available: !conflict });
};
