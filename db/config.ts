import { defineDb, defineTable, column } from "astro:db";

const ProductsTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(),
    slug: column.text({ unique: true }),
    description: column.text({ optional: true }),
    longDescription: column.text({ optional: true }),
    gender: column.text({ optional: true }), // 'M' | 'W' | 'U'
    brandId: column.text({ references: () => BrandsTable.columns.id }),
    defaultSkuId: column.text(), // no FK to avoid circular dependency
    collectionIds: column.json({ optional: true }),
    activity: column.json({ optional: true }), // string[] e.g. ["alpinismo", "trekking"]
    createdAt: column.date(),
    updatedAt: column.date(),
    deletedAt: column.date({ optional: true }),
  },
  indexes: [{ on: ["updatedAt"] }],
});

// One row per color — owns the gallery images
const VariantsTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    productId: column.text({ references: () => ProductsTable.columns.id }),
    color: column.text({ optional: true }),
    imageIds: column.json({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
    deletedAt: column.date({ optional: true }),
  },
  indexes: [{ on: ["updatedAt"] }],
});

// One row per purchasable unit (size × color)
const SkusTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    variantId: column.text({ references: () => VariantsTable.columns.id }),
    size: column.number({ optional: true }),
    price: column.number(),
    stockQty: column.number(),
    createdAt: column.date(),
    updatedAt: column.date(),
    deletedAt: column.date({ optional: true }),
  },
  indexes: [{ on: ["updatedAt"] }],
});

// Navigation category tree — section "genere" appears under Uomo/Donna, "attrezzatura" under Attrezzatura
const CollectionsTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }), // slug, matches product collectionIds values
    label: column.text(),
    parentId: column.text({ optional: true }),
    section: column.text({ optional: true }), // "genere" | "attrezzatura"
    position: column.number({ optional: true }),
  },
  indexes: [{ on: ["section"] }],
});

const BrandsTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(),
    slug: column.text(),
    description: column.text({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
    deletedAt: column.date({ optional: true }),
  },
  indexes: [{ on: ["name"] }, { on: ["updatedAt"] }],
});

export default defineDb({
  tables: {
    Products: ProductsTable,
    Variants: VariantsTable,
    Skus: SkusTable,
    Brands: BrandsTable,
    Collections: CollectionsTable,
  },
});
