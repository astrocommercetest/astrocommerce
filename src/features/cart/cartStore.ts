import { persistentMap } from "@nanostores/persistent";
import { atom, computed } from "nanostores";

export const isCartOpen = atom(false);
import type { Variants } from "astro:db";

type Variant = typeof Variants.$inferSelect;

export type CartItem = {
  variant: Variant;
  qty: number;
};

// keyed by variant id, persisted to localStorage
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
    (sum, item) => sum + item.variant.price * item.qty,
    0,
  ),
);

export function addToCart(variant: Variant, qty = 1) {
  const existing = cartItems.get()[variant.id];
  if (existing) {
    cartItems.setKey(variant.id, { ...existing, qty: existing.qty + qty });
  } else {
    cartItems.setKey(variant.id, { variant, qty });
  }
}

export function removeFromCart(variantId: string) {
  const items = { ...cartItems.get() };
  delete items[variantId];
  cartItems.set(items);
}

export function updateQty(variantId: string, qty: number) {
  if (qty <= 0) {
    removeFromCart(variantId);
  } else {
    const existing = cartItems.get()[variantId];
    if (existing) cartItems.setKey(variantId, { ...existing, qty });
  }
}
