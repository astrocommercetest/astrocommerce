import React from "react";
import { cloudinaryImagePath } from "../../lib/cloudinary";
import type { Products, Variants, Brands } from "astro:db";
import { addToCart } from "../cart/cartStore";
import { toast } from "../toasts/toast";

type Product = typeof Products.$inferSelect;
type Variant = typeof Variants.$inferSelect;
type Brand = typeof Brands.$inferSelect;

interface Props {
  product: Product;
  variants: Variant[];
  brand: Brand | null;
}

const defaultVariant = (variants: Variant[], defaultVariantId: string) => {
  return variants.find((v) => v.id === defaultVariantId) || variants[0];
};

function DiagonalStrike() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
    >
      <line x1="0" y1="100%" x2="100%" y2="0" stroke="#d1d5db" strokeWidth="1.5" />
    </svg>
  );
}

export default function Product({ product, variants, brand }: Props) {
  const [variant, setVariant] = React.useState<Variant>(
    defaultVariant(variants, product.defaultVariantId),
  );
  // null = user hasn't explicitly chosen this axis yet → no cross-filtering applied
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [selectedSize, setSelectedSize] = React.useState<number | null>(null);

  const uniqueSizes = [
    ...new Set(variants.map((v) => v.size).filter((s): s is number => s != null)),
  ];
  const uniqueColors = [
    ...new Set(variants.map((v) => v.color).filter((c): c is string => c != null)),
  ];

  const isSizeDisabled = (size: number) =>
    selectedColor !== null
      ? !variants.some((v) => v.size === size && v.color === selectedColor && v.stockQty > 0)
      : !variants.some((v) => v.size === size && v.stockQty > 0);

  const isColorDisabled = (color: string) =>
    selectedSize !== null
      ? !variants.some((v) => v.color === color && v.size === selectedSize && v.stockQty > 0)
      : !variants.some((v) => v.color === color && v.stockQty > 0);

  const selectColor = (color: string) => {
    const next =
      variants.find((v) => v.color === color && v.size === selectedSize && v.stockQty > 0) ||
      variants.find((v) => v.color === color && v.stockQty > 0) ||
      variant;
    setSelectedColor(color);
    setSelectedSize(next.size);
    setVariant(next);
  };

  const selectSize = (size: number) => {
    const next =
      variants.find((v) => v.size === size && v.color === selectedColor && v.stockQty > 0) ||
      variants.find((v) => v.size === size && v.stockQty > 0) ||
      variant;
    setSelectedSize(size);
    setSelectedColor(next.color);
    setVariant(next);
  };

  return (
    <div className="flex gap-16">
      <article className="order-2">
        <header>
          <h1 className="text-4xl font-extrabold">{product.name}</h1>
          {brand && <p className="text-sm text-gray-500">{brand.name}</p>}
        </header>
        <p className="mt-4 text-balance">{product.description}</p>
        <div className="mt-8">
          <p className="text-2xl font-bold">€{variant.price.toFixed(2)}</p>
          <p className="text-sm text-gray-500">
            {variant.stockQty > 0
              ? `${variant.stockQty} in stock`
              : "Out of stock"}
          </p>
        </div>

        {variants.length > 1 && (
          <div className="mt-6 flex flex-col gap-6">
            {uniqueColors.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Color:{" "}
                  <span className="font-normal text-gray-500">{variant.color}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => {
                    const colorVariant = variants.find((v) => v.color === color);
                    const isActive = (selectedColor ?? variant.color) === color;
                    const disabled = isColorDisabled(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        disabled={disabled}
                        onClick={() => selectColor(color)}
                        className={[
                          "relative w-12 h-12 rounded overflow-hidden border-2 transition",
                          isActive
                            ? "border-gray-900 ring-2 ring-gray-900 ring-offset-1"
                            : "border-gray-200 hover:border-gray-500",
                          disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                        ].join(" ")}
                      >
                        <img
                          src={cloudinaryImagePath(
                            "w_48,h_48,c_fill,q_auto,f_auto",
                            colorVariant?.imageId,
                          )}
                          alt={color}
                          className="w-full h-full object-cover"
                        />
                        {disabled && <DiagonalStrike />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {uniqueSizes.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Size</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => {
                    const isActive = (selectedSize ?? variant.size) === size;
                    const disabled = isSizeDisabled(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectSize(size)}
                        className={[
                          "relative min-w-[3rem] h-10 px-3 rounded border text-sm font-medium transition overflow-hidden",
                          isActive
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-900",
                          disabled ? "text-gray-300 border-gray-200 cursor-not-allowed" : "cursor-pointer",
                        ].join(" ")}
                      >
                        {size}
                        {disabled && <DiagonalStrike />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              className="button"
              onClick={() => {
                addToCart(variant);
                toast.success("Added to cart");
              }}
              disabled={variant.stockQty === 0}
            >
              Add to Cart
            </button>
          </div>
        )}
      </article>
      <aside className="order-1">
        <img
          src={cloudinaryImagePath(
            "w_400,h_400,c_fill,q_auto,f_auto",
            variant.imageId,
          )}
          alt={product.name}
          className="w-96 h-96 object-cover"
        />
      </aside>
    </div>
  );
}
