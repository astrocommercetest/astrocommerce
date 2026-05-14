import { db, Brands, Products, Variants } from "astro:db";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
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

async function syncImages(variants: any[]): Promise<void> {
  const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn(
      "[seed] Cloudinary env vars not set — skipping image uploads, imageId kept as placeholder.",
    );
    return;
  }

  // Dynamic import so the SDK only initialises after we've confirmed credentials exist
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const manifest = loadManifest();
  const withImage = variants.filter((v) =>
    existsSync(resolve(IMAGES_DIR, `${v.id}.webp`)),
  );
  const total = withImage.length;
  let uploaded = 0;
  let skipped = 0;

  const log = () =>
    process.stdout.write(
      `\r[seed] images ${uploaded + skipped}/${total} — ${uploaded} uploaded, ${skipped} unchanged  `,
    );

  for (const variant of withImage) {
    const imagePath = resolve(IMAGES_DIR, `${variant.id}.webp`);
    const hash = fileHash(imagePath);
    const cached = manifest[variant.id];

    if (cached?.hash === hash) {
      variant.imageId = cached.cloudinaryId;
      skipped++;
      log();
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(imagePath, {
        public_id: variant.id,
        overwrite: true,
        resource_type: "image",
      });
      manifest[variant.id] = { hash, cloudinaryId: result.public_id };
      variant.imageId = result.public_id;
      uploaded++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e, null, 2);
      process.stdout.write("\n");
      console.warn(`[seed] Cloudinary upload failed for ${variant.id}: ${msg}`);
      console.warn(
        "[seed] Check CLOUDINARY_CLOUD_NAME / API credentials in .env — skipping uploads.",
      );
      return;
    }
    log();
  }

  process.stdout.write("\n");
  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  console.log(`[seed] images done: ${uploaded} uploaded, ${skipped} unchanged`);
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
  const { brands, products, variants } = JSON.parse(
    readFileSync(SEED_FILE, "utf-8"),
  );

  await syncImages(variants);

  // Clear in reverse FK order, insert in FK order
  await db.delete(Variants);
  await db.delete(Products);
  await db.delete(Brands);

  await db.insert(Brands).values(brands.map(toRow));
  await db.insert(Products).values(products.map(toRow));
  await db.insert(Variants).values(variants.map(toRow));

  console.log(
    `[seed] done: ${brands.length} brands, ${products.length} products, ${variants.length} variants`,
  );
}
