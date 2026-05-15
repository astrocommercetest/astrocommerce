import { persistentMap } from "@nanostores/persistent";
import { atom, computed } from "nanostores";
import type { Variants, Skus } from "astro:db";

export const isCartOpen = atom(false);

type Variant = typeof Variants.$inferSelect;
type Sku = typeof Skus.$inferSelect;

export type CartItem = {
  sku: Sku;
  variant: Variant;
  qty: number;
};

// keyed by sku id, persisted to localStorage
export const cartItems = persistentMap<Record<string, CartItem>>(
  "cart:",
  {},
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

export const cartCount = computed(cartItems, (items) =>
  Object.values(items).reduce((sum, item) => sum + item.qty, 0),
);

export const cartTotal = computed(cartItems, (items) =>
  Object.values(items).reduce(
    (sum, item) => sum + item.sku.price * item.qty,
    0,
  ),
);

export function addToCart(sku: Sku, variant: Variant, qty = 1) {
  const existing = cartItems.get()[sku.id];
  if (existing) {
    cartItems.setKey(sku.id, { ...existing, qty: existing.qty + qty });
  } else {
    cartItems.setKey(sku.id, { sku, variant, qty });
  }
}

export function removeFromCart(skuId: string) {
  const items = { ...cartItems.get() };
  delete items[skuId];
  cartItems.set(items);
}

export function updateQty(skuId: string, qty: number) {
  if (qty <= 0) {
    removeFromCart(skuId);
  } else {
    const existing = cartItems.get()[skuId];
    if (existing) cartItems.setKey(skuId, { ...existing, qty });
  }
}
