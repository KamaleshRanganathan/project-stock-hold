"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type StockEntry = {
  warehouseId: string;
  warehouseName: string;
  location: string;
  totalUnits: number;
  availableUnits: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: StockEntry[];
};

export default function ProductDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        const found = data.find((p) => p.id === id);
        setProduct(found || null);
        setLoading(false);
      });
  }, [id]);

  const selectedStock = product?.stock.find(
    (s) => s.warehouseId === selectedWarehouse,
  );

  async function handleReserve() {
    if (!selectedWarehouse || !product) return;
    setReserving(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          warehouseId: selectedWarehouse,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reserve");
      } else {
        router.push(`/reservations/${data.id}`);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setReserving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-xl font-bold text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
          >
            StockHold
          </button>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Image */}
            <div className="lg:w-2/5 h-72 lg:h-auto overflow-hidden bg-gray-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 p-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {product.name}
              </h1>
              <p className="text-gray-500 mt-2">{product.description}</p>
              <p className="text-3xl font-bold text-gray-900 mt-4">
                ₹{product.price.toLocaleString()}
              </p>

              {/* Warehouse selection */}
              <div className="mt-8">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Select Warehouse
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.stock.map((s) => (
                    <button
                      key={s.warehouseId}
                      onClick={() => {
                        setSelectedWarehouse(s.warehouseId);
                        setQuantity(1);
                        setError(null);
                      }}
                      disabled={s.availableUnits === 0}
                      className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${
                          selectedWarehouse === s.warehouseId
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {s.warehouseName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.location}
                      </p>
                      <p
                        className={`text-xs font-medium mt-2 ${
                          s.availableUnits > 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {s.availableUnits > 0
                          ? `${s.availableUnits} units available`
                          : "Out of stock"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              {selectedWarehouse && selectedStock && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Quantity
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-xl font-semibold text-gray-900 w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(selectedStock.availableUnits, q + 1),
                        )
                      }
                      className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-400">
                      Max {selectedStock.availableUnits}
                    </span>
                  </div>
                </div>
              )}

              {/* Total */}
              {selectedWarehouse && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{(product.price * quantity).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Reserve button */}
              <button
                onClick={handleReserve}
                disabled={!selectedWarehouse || reserving}
                className="mt-6 w-full py-4 rounded-xl bg-gray-900 text-white font-semibold text-sm
                  hover:bg-gray-700 transition-colors cursor-pointer
                  disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {reserving
                  ? "Reserving..."
                  : !selectedWarehouse
                    ? "Select a warehouse to continue"
                    : `Reserve ${quantity} unit${quantity > 1 ? "s" : ""} — ₹${(
                        product.price * quantity
                      ).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
