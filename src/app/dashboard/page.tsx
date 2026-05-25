"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">
          Loading products...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-xl font-bold text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
          >
            StockHold
          </button>
          <span className="text-sm text-gray-400">Dashboard</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Click on a product to view stock and reserve units.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const totalAvailable = product.stock.reduce(
              (sum, s) => sum + s.availableUnits,
              0,
            );

            return (
              <div
                key={product.id}
                onClick={() => router.push(`/products/${product.id}`)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
              >
                {/* Image placeholder */}
                <div className="w-full h-52 relative overflow-hidden bg-gray-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-gray-300"
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
                  {totalAvailable === 0 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-gray-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        totalAvailable > 0
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {totalAvailable > 0 ? "In Stock" : "Sold Out"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
