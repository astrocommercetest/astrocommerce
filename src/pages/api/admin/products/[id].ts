import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { db, Products, Variants, Skus, eq, inArray } from "astro:db";
import { requireAdmin } from "@/lib/admin-auth";

export const GET: APIRoute = async ({ request, params }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = params;
  if (!id) return Response.json({ error: "ID mancante." }, { status: 400 });

  const [product] = await db.select().from(Products).where(eq(Products.id, id));
  if (!product) return Response.json({ error: "Prodotto non trovato." }, { status: 404 });

  const variants = await db.select().from(Variants).where(eq(Variants.productId, id));
  const variantsWithSkus = await Promise.all(
    variants.map(async (v) => ({
      ...v,
      skus: await db.select().from(Skus).where(eq(Skus.variantId, v.id)),
    })),
  );

  return Response.json({ ...product, variants: variantsWithSkus });
};

export const PUT: APIRoute = async ({ request, params }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = params;
  if (!id) return Response.json({ error: "ID mancante." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const {
    name, slug, description, longDescription, gender, brandId,
    activity, collectionIds, variants: variantDrafts, defaultSkuId: defaultSkuIdInput, published,
  } = body;

  const now = new Date();

  type SkuDraft = { size: string; price: string; stockQty: string };
  type VariantDraft = { color: string; imageIds: string[]; skus: SkuDraft[] };

  // Replace variants + SKUs
  if (variantDrafts !== undefined) {
    const existingVariants = await db.select({ id: Variants.id }).from(Variants).where(eq(Variants.productId, id));
    const existingVariantIds = existingVariants.map((v) => v.id);

    if (existingVariantIds.length > 0) {
      await db.delete(Skus).where(inArray(Skus.variantId, existingVariantIds));
      await db.delete(Variants).where(inArray(Variants.id, existingVariantIds));
    }

    const drafts = (variantDrafts as VariantDraft[]) ?? [];
    type SkuInsert = { id: string; variantId: string; size: number | null; price: number; stockQty: number };
    const skuInserts: SkuInsert[] = [];
    const skuPositionMap: Record<string, string> = {};

    for (let vi = 0; vi < drafts.length; vi++) {
      const variantId = randomUUID();
      await db.insert(Variants).values({ id: variantId, productId: id, color: drafts[vi].color || null, imageIds: drafts[vi].imageIds ?? [], createdAt: now, updatedAt: now });
      for (let si = 0; si < (drafts[vi].skus ?? []).length; si++) {
        const sd = drafts[vi].skus[si];
        const skuId = randomUUID();
        skuPositionMap[`${vi}-${si}`] = skuId;
        skuInserts.push({ id: skuId, variantId, size: sd.size ? Number(sd.size) : null, price: Number(sd.price) || 0, stockQty: Number(sd.stockQty) || 0 });
      }
    }

    for (const s of skuInserts) {
      await db.insert(Skus).values({ ...s, createdAt: now, updatedAt: now });
    }

    const resolvedDefaultSkuId = skuPositionMap[String(defaultSkuIdInput)] ?? skuInserts[0]?.id ?? null;
    await db.update(Products).set({ defaultSkuId: resolvedDefaultSkuId, updatedAt: now }).where(eq(Products.id, id));
  }

  // Update scalar product fields
  await db
    .update(Products)
    .set({
      ...(name !== undefined && { name: name as string }),
      ...(slug !== undefined && { slug: slug as string }),
      ...(description !== undefined && { description: (description as string) || null }),
      ...(longDescription !== undefined && { longDescription: (longDescription as string) || null }),
      ...(gender !== undefined && { gender: (gender as string) || null }),
      ...(brandId !== undefined && { brandId: (brandId as string) || null }),
      ...(activity !== undefined && { activity }),
      ...(collectionIds !== undefined && { collectionIds }),
      ...(published !== undefined && { published: published as boolean }),
      updatedAt: now,
    })
    .where(eq(Products.id, id));

  return Response.json({ ok: true });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = params;
  if (!id) return Response.json({ error: "ID mancante." }, { status: 400 });

  const now = new Date();
  await db.update(Products).set({ deletedAt: now, updatedAt: now }).where(eq(Products.id, id));
  return Response.json({ ok: true });
};
