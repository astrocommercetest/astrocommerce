import { db, Brands, Products, Variants, Skus, Collections, User, Session, Account, Verification, eq } from "astro:db";
import { auth } from "../src/features/auth/auth";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const SEED_FILE = resolve(ROOT, "testdata/seed.json");
const IMAGES_DIR = resolve(ROOT, "testdata/images");
const MANIFEST_FILE = resolve(ROOT, "testdata/.image-manifest.json");

type Manifest = Record<string, { hash: string; cloudinaryId: string }>;

function fileHash(filePath: string): string {
  return createHash("md5").update(readFileSync(filePath)).digest("hex");
}

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_FILE)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_FILE, "utf-8"));
  } catch {
    return {};
  }
}

// Returns image files for a variant in order: primary first, then gallery sorted.
// e.g. variant-1.webp, variant-1-1.webp, variant-1-2.webp
function variantImageFiles(variantId: string): string[] {
  const all = readdirSync(IMAGES_DIR);
  const ext = /\.(webp|jpg|jpeg|png)$/i;
  return all
    .filter((f) => {
      const base = f.replace(ext, "");
      return base === variantId || base.startsWith(`${variantId}-`);
    })
    .sort((a, b) => {
      const aBase = a.replace(ext, "");
      const bBase = b.replace(ext, "");
      if (aBase === variantId) return -1;
      if (bBase === variantId) return 1;
      return aBase.localeCompare(bBase, undefined, { numeric: true });
    });
}

async function syncImages(variants: any[]): Promise<void> {
  const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn(
      "[seed] Cloudinary env vars not set — skipping image uploads, imageIds kept empty.",
    );
    return;
  }

  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const manifest = loadManifest();

  // Build a flat list of all images to process across all variants
  type ImageJob = { variantId: string; publicId: string; filePath: string };
  const jobs: ImageJob[] = variants.flatMap((v) =>
    variantImageFiles(v.id).map((file) => ({
      variantId: v.id,
      publicId: file.replace(/\.(webp|jpg|jpeg|png)$/i, ""),
      filePath: resolve(IMAGES_DIR, file),
    })),
  );

  const total = jobs.length;
  let uploaded = 0;
  let skipped = 0;
  const log = () =>
    process.stdout.write(
      `\r[seed] images ${uploaded + skipped}/${total} — ${uploaded} uploaded, ${skipped} unchanged  `,
    );

  const resolvedIds: Map<string, string[]> = new Map();

  for (const { variantId, publicId, filePath } of jobs) {
    const hash = fileHash(filePath);
    const cached = manifest[publicId];
    let cloudinaryId: string;

    if (cached?.hash === hash) {
      cloudinaryId = cached.cloudinaryId;
      skipped++;
      log();
    } else {
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          public_id: publicId,
          overwrite: true,
          resource_type: "image",
        });
        manifest[publicId] = { hash, cloudinaryId: result.public_id };
        cloudinaryId = result.public_id;
        uploaded++;
        log();
      } catch (e) {
        const msg = e instanceof Error ? e.message : JSON.stringify(e, null, 2);
        process.stdout.write("\n");
        console.warn(`[seed] Cloudinary upload failed for ${publicId}: ${msg}`);
        console.warn("[seed] Skipping remaining uploads.");
        return;
      }
    }

    const ids = resolvedIds.get(variantId) ?? [];
    ids.push(cloudinaryId);
    resolvedIds.set(variantId, ids);
  }

  process.stdout.write("\n");
  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  console.log(`[seed] images done: ${uploaded} uploaded, ${skipped} unchanged`);

  for (const variant of variants) {
    variant.imageIds = resolvedIds.get(variant.id) ?? [];
  }
}

function toRow<T extends Record<string, any>>(row: T) {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
  };
}

export default async function seed() {
  const { brands, products, variants, skus, collections } = JSON.parse(
    readFileSync(SEED_FILE, "utf-8"),
  );

  await syncImages(variants);

  // Clear in reverse FK order, insert in FK order
  await db.delete(Skus);
  await db.delete(Variants);
  await db.delete(Products);
  await db.delete(Brands);
  await db.delete(Collections);
  await db.delete(Session);
  await db.delete(Account);
  await db.delete(Verification);
  await db.delete(User);

  await db.insert(Brands).values(brands.map(toRow));
  await db.insert(Products).values(products.map(toRow));
  await db.insert(Variants).values(variants.map(toRow));
  await db.insert(Skus).values(skus.map(toRow));
  // Collections are self-referential — insert parents before children
  await db.insert(Collections).values(collections);

  await auth.api.signUpEmail({
    body: {
      name: "Matteo Leoni",
      email: "leoni.matteo@gmail.com",
      password: "astrocommerce",
    },
  });
  await db
    .update(User)
    .set({ emailVerified: true, role: "admin" })
    .where(eq(User.email, "leoni.matteo@gmail.com"));

  console.log(
    `[seed] done: ${brands.length} brands, ${products.length} products, ${variants.length} variants, ${skus.length} skus, ${collections.length} collections`,
  );
  console.log("[seed] admin user: leoni.matteo@gmail.com / astrocommerce");
}
