"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

type Reservation = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: string;
  expiresAt: string;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function ReservationPage() {
  const router = useRouter();
  const { id } = useParams();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"confirmed" | "released" | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [resRes, prodRes] = await Promise.all([
          fetch(`/api/reservations/${id}`),
          fetch("/api/products"),
        ]);
        const resData = await resRes.json();
        const products = await prodRes.json();
        setReservation(resData);
        const found = products.find((p: Product) => p.id === resData.productId);
        setProduct(found || null);

        const secondsLeft = Math.max(
          0,
          Math.floor((new Date(resData.expiresAt).getTime() - Date.now()) / 1000)
        );
        setTimeLeft(secondsLeft);
      } catch {
        setError("Failed to load reservation");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to confirm");
      } else {
        setDone("confirmed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setConfirming(false);
    }
  }, [id]);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/reservations/${id}/release`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to cancel");
      } else {
        setDone("released");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setCancelling(false);
    }
  }, [id]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const isExpired = timeLeft === 0 && reservation?.status === "pending";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Loading reservation...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Reservation not found.</p>
      </div>
    );
  }

  // Done state
  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            done === "confirmed" ? "bg-green-50" : "bg-gray-100"
          }`}>
            {done === "confirmed" ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {done === "confirmed" ? "Order Confirmed!" : "Reservation Cancelled"}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {done === "confirmed"
              ? `Your order for ${reservation.quantity} unit${reservation.quantity > 1 ? "s" : ""} of ${product?.name} has been confirmed.`
              : "Your reservation has been released. The stock is now available for others."}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
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
          <span className="text-sm text-gray-400">Checkout</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        {/* Timer */}
        <div className={`rounded-2xl p-6 mb-6 text-center ${
          isExpired
            ? "bg-red-50 border border-red-100"
            : timeLeft < 60
            ? "bg-orange-50 border border-orange-100"
            : "bg-gray-900"
        }`}>
          {isExpired ? (
            <>
              <p className="text-red-600 font-semibold text-sm mb-1">Reservation Expired</p>
              <p className="text-red-500 text-xs">This reservation has timed out. Please start over.</p>
            </>
          ) : (
            <>
              <p className={`text-sm font-medium mb-2 ${timeLeft < 60 ? "text-orange-600" : "text-gray-400"}`}>
                Reservation expires in
              </p>
              <p className={`text-5xl font-bold tracking-tight ${timeLeft < 60 ? "text-orange-600" : "text-white"}`}>
                {minutes}:{seconds}
              </p>
              <p className={`text-xs mt-2 ${timeLeft < 60 ? "text-orange-400" : "text-gray-500"}`}>
                Complete your purchase before the timer runs out
              </p>
            </>
          )}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Summary</h2>

          <div className="flex gap-4 items-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{product?.name}</p>
              <p className="text-sm text-gray-400">Qty: {reservation.quantity}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-gray-50 pt-4">
            <div className="flex justify-between text-gray-500">
              <span>Unit price</span>
              <span>₹{product?.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Quantity</span>
              <span>{reservation.quantity}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>₹{((product?.price || 0) * reservation.quantity).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Reservation info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Reservation Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Reservation ID</span>
              <span className="text-gray-700 font-mono text-xs">{reservation.id.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className="text-yellow-600 font-semibold capitalize">{reservation.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span className="text-gray-700">{new Date(reservation.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Actions */}
        {!isExpired && (
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={confirming || cancelling}
              className="w-full py-4 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 transition-colors cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {confirming ? "Confirming..." : "Confirm Purchase"}
            </button>
            <button
              onClick={handleCancel}
              disabled={confirming || cancelling}
              className="w-full py-4 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cancelling ? "Cancelling..." : "Cancel Reservation"}
            </button>
          </div>
        )}

        {isExpired && (
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        )}
      </main>
    </div>
  );
}