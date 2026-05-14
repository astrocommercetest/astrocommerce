import { defineDb, defineTable, column } from "astro:db";

const ProductsTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(),
    slug: column.text({ unique: true }),
    description: column.text({ optional: true }),
    brandId: column.text({ references: () => BrandsTable.columns.id }),
    defaultVariantId: column.text(),
    collectionIds: column.json({ optional: true }),
    variantIds: column.json({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
    deletedAt: column.date({ optional: true }),
  },
  indexes: [{ on: ["updatedAt"] }],
});

const VariantsTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    productId: column.text({ references: () => ProductsTable.columns.id }),
    size: column.number({ optional: true }),
    color: column.text({ optional: true }),
    imageId: column.text({ optional: true }),
    price: column.number(),
    stockQty: column.number(),
    createdAt: column.date(),
    updatedAt: column.date(),
    deletedAt: column.date({ optional: true }),
  },
  indexes: [{ on: ["updatedAt"] }],
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
    Brands: BrandsTable,
  },
});
