import { useStore } from "@nanostores/react";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { cartCount, isCartOpen } from "./cartStore";
export default function CartBadge() {
  const count = useStore(cartCount);

  return (
    <button
      onClick={() => isCartOpen.set(true)}
      className="relative inline-flex cursor-pointer"
    >
      <ShoppingCartIcon className="w-6 h-6" />
      {count > 0 && (
        <span
          key={count}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none "
        >
          {count}
        </span>
      )}
    </button>
  );
}
