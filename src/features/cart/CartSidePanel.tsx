import { useStore } from "@nanostores/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  isCartOpen,
  cartItems,
  cartTotal,
  removeFromCart,
  updateQty,
} from "./cartStore";
import { cloudinaryImagePath } from "../../lib/cloudinary";

export default function CartSidepanel() {
  const open = useStore(isCartOpen);
  const items = useStore(cartItems);
  const total = useStore(cartTotal);
  const entries = Object.values(items);

  return (
    <>
      <div
        onClick={() => isCartOpen.set(false)}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Cart ({entries.length})</h2>
          <button onClick={() => isCartOpen.set(false)}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-8">
              Your cart is empty
            </p>
          ) : (
            entries.map(({ variant, qty }) => (
              <div key={variant.id} className="flex gap-3 items-start">
                <img
                  src={cloudinaryImagePath(
                    "w_80,h_80,c_fill,q_auto,f_auto",
                    variant.imageId,
                  )}
                  alt=""
                  className="w-20 h-20 object-cover"
                />
                <div className="flex-1 text-sm">
                  <p className="font-medium">
                    {variant.color} — EU {variant.size}
                  </p>
                  <p className="text-gray-500">€{variant.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => updateQty(variant.id, qty - 1)}
                      className="w-6 h-6 border border-gray-400 rounded text-center"
                    >
                      −
                    </button>
                    <span>{qty}</span>
                    <button
                      onClick={() => updateQty(variant.id, qty + 1)}
                      className="w-6 h-6 border border-gray-400 rounded text-center"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(variant.id)}
                      className="ml-2 text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {entries.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-between text-sm font-semibold mb-3">
              <span>Total!</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <button className="button w-full">Checkout</button>
          </div>
        )}
      </div>
    </>
  );
}
