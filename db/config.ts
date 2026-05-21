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
    published: column.boolean(),
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

const UserTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(),
    email: column.text({ unique: true }),
    emailVerified: column.boolean(),
    image: column.text({ optional: true }),
    role: column.text({ optional: true }),
    shippingAddress: column.text({ optional: true }),
    shippingCity: column.text({ optional: true }),
    shippingZip: column.text({ optional: true }),
    shippingProvince: column.text({ optional: true }),
    shippingPhone: column.text({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

const SessionTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    expiresAt: column.date(),
    token: column.text({ unique: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
    ipAddress: column.text({ optional: true }),
    userAgent: column.text({ optional: true }),
    userId: column.text({ references: () => UserTable.columns.id }),
  },
});

const AccountTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    accountId: column.text(),
    providerId: column.text(),
    userId: column.text({ references: () => UserTable.columns.id }),
    accessToken: column.text({ optional: true }),
    refreshToken: column.text({ optional: true }),
    idToken: column.text({ optional: true }),
    accessTokenExpiresAt: column.date({ optional: true }),
    refreshTokenExpiresAt: column.date({ optional: true }),
    scope: column.text({ optional: true }),
    password: column.text({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

const VerificationTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    identifier: column.text(),
    value: column.text(),
    expiresAt: column.date(),
    createdAt: column.date({ optional: true }),
    updatedAt: column.date({ optional: true }),
  },
});

const OrdersTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text({ optional: true }),
    guestEmail: column.text({ optional: true }),
    status: column.text(),
    subtotal: column.number(),
    items: column.json(),
    shippingName: column.text(),
    shippingAddress: column.text(),
    shippingCity: column.text(),
    shippingZip: column.text(),
    shippingProvince: column.text(),
    shippingPhone: column.text(),
    notes: column.text({ optional: true }),
    paymentRef: column.text({ optional: true }),
    paidAt: column.date({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
  indexes: [{ on: ["userId"] }, { on: ["createdAt"] }],
});

const ActivitiesTable = defineTable({
  columns: {
    id: column.text({ primaryKey: true }), // slug, e.g. "escursionismo"
    label: column.text(),
  },
});

export default defineDb({
  tables: {
    Products: ProductsTable,
    Variants: VariantsTable,
    Skus: SkusTable,
    Brands: BrandsTable,
    Collections: CollectionsTable,
    User: UserTable,
    Session: SessionTable,
    Account: AccountTable,
    Verification: VerificationTable,
    Orders: OrdersTable,
    Activities: ActivitiesTable,
  },
});
