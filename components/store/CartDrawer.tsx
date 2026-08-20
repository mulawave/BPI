"use client";

import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[70] h-full w-full max-w-md transform transition-transform duration-300 ease-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isCartOpen}
      >
        <div className="flex h-full flex-col bg-white dark:bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Your Cart
              </h2>
              {totalItems > 0 && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </div>
            <button
              onClick={closeCart}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Your cart is empty
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Browse the store and add items to get started.
                  </p>
                </div>
                <Button
                  onClick={closeCart}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3"
                  >
                    {/* Image */}
                    <Link
                      href={`/store/${item.productId}`}
                      onClick={closeCart}
                      className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
                    >
                      <img
                        src={item.image || "/img/default.jpg"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/img/default.jpg";
                        }}
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex flex-1 flex-col gap-1">
                      <Link
                        href={`/store/${item.productId}`}
                        onClick={closeCart}
                        className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        {item.name}
                      </Link>
                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {item.productType}
                      </span>
                      <div className="mt-1 flex items-center justify-between">
                        {/* Quantity */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="self-start rounded-md p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={clearCart}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 py-2 text-xs font-medium text-slate-500 hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  Clear all items
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})
                </span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                Secure checkout with fiat + token support
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                size="lg"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                onClick={closeCart}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
