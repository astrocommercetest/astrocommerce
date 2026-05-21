import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { db, Products, Variants, Skus, Brands, eq, isNull, inArray } from "astro:db";
import { requireAdmin } from "@/lib/admin-auth";

export const GET: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const rows = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      gender: Products.gender,
      brandName: Brands.name,
      published: Products.published,
      deletedAt: Products.deletedAt,
      defaultSkuId: Products.defaultSkuId,
    })
    .from(Products)
    .leftJoin(Brands, eq(Products.brandId, Brands.id));

  // Resolve thumbnails: defaultSkuId → variantId → imageIds[0]
  const thumbMap: Record<string, string> = {};
  const skuIds = rows.map((p) => p.defaultSkuId).filter(Boolean) as string[];
  if (skuIds.length > 0) {
    const skuRows = await db.select().from(Skus).where(inArray(Skus.id, skuIds));
    const variantIds = skuRows.map((s) => s.variantId).filter(Boolean) as string[];
    if (variantIds.length > 0) {
      const variantRows = await db.select().from(Variants).where(inArray(Variants.id, variantIds));
      const variantImageMap: Record<string, string | null> = {};
      for (const v of variantRows) {
        variantImageMap[v.id] = (v.imageIds as string[] | null)?.[0] ?? null;
      }
      for (const s of skuRows) {
        if (s.variantId) thumbMap[s.id] = variantImageMap[s.variantId] ?? "";
      }
    }
  }

  // Variant counts
  const variantCounts = await db.select().from(Variants).where(isNull(Variants.deletedAt));

  const countMap: Record<string, number> = {};
  for (const v of variantCounts) {
    if (v.productId) countMap[v.productId] = (countMap[v.productId] ?? 0) + 1;
  }

  return Response.json(rows.map((p) => ({
    ...p,
    thumb: p.defaultSkuId ? (thumbMap[p.defaultSkuId] || null) : null,
    variantCount: countMap[p.id] ?? 0,
  })));
};

export const POST: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { name, slug, description, longDescription, gender, brandId, activity, collectionIds, variants: variantDrafts, defaultSkuId: defaultSkuIdInput, published } = body as Record<string, unknown>;

  if (!name || !slug) {
    return Response.json({ error: "Nome e slug obbligatori." }, { status: 400 });
  }

  const now = new Date();
  const productId = randomUUID();

  type SkuDraft = { size: string; price: string; stockQty: string };
  type VariantDraft = { color: string; imageIds: string[]; skus: SkuDraft[] };

  const drafts = (variantDrafts as VariantDraft[]) ?? [];

  type SkuInsert = { id: string; variantId: string; size: number | null; price: number; stockQty: number };
  const skuInserts: SkuInsert[] = [];
  const variantInserts: { id: string; productId: string; color: string | null; imageIds: string[] }[] = [];
  const skuPositionMap: Record<string, string> = {};

  for (let vi = 0; vi < drafts.length; vi++) {
    const variantId = randomUUID();
    variantInserts.push({ id: variantId, productId, color: drafts[vi].color || null, imageIds: drafts[vi].imageIds ?? [] });
    for (let si = 0; si < (drafts[vi].skus ?? []).length; si++) {
      const sd = drafts[vi].skus[si];
      const skuId = randomUUID();
      skuPositionMap[`${vi}-${si}`] = skuId;
      skuInserts.push({ id: skuId, variantId, size: sd.size ? Number(sd.size) : null, price: Number(sd.price) || 0, stockQty: Number(sd.stockQty) || 0 });
    }
  }

  const defaultSkuId = skuPositionMap[String(defaultSkuIdInput)] ?? skuInserts[0]?.id ?? null;

  await db.insert(Products).values({
    id: productId,
    name: name as string,
    slug: slug as string,
    description: (description as string) ?? null,
    longDescription: (longDescription as string) ?? null,
    gender: (gender as string) ?? null,
    brandId: (brandId as string) ?? null,
    defaultSkuId,
    activity: activity ?? null,
    collectionIds: collectionIds ?? null,
    published: published !== false ? true : false,
    createdAt: now,
    updatedAt: now,
  });

  for (const v of variantInserts) {
    await db.insert(Variants).values({ ...v, imageIds: v.imageIds, createdAt: now, updatedAt: now });
  }
  for (const s of skuInserts) {
    await db.insert(Skus).values({ ...s, createdAt: now, updatedAt: now });
  }

  return Response.json({ id: productId }, { status: 201 });
};
