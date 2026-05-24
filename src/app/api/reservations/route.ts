import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { z } from "zod";

const reservationSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = reservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { productId, warehouseId, quantity } = parsed.data;

    // Lock key unique to this product+warehouse combination
    const lockKey = `lock:${productId}:${warehouseId}`;
    const lockValue = crypto.randomUUID();
    const lockTTL = 5000; // 5 seconds

    // Try to acquire lock
    const acquired = await redis.set(lockKey, lockValue, {
      nx: true,
      px: lockTTL,
    });

    if (!acquired) {
      return NextResponse.json({ error: "Another reservation is in progress, try again" }, { status: 409 });
    }

    try {
      // Find the stock row
      const stock = await prisma.stock.findUnique({
        where: {
          productId_warehouseId: { productId, warehouseId },
        },
      });

      if (!stock) {
        return NextResponse.json({ error: "Stock not found" }, { status: 404 });
      }

      const availableUnits = stock.totalUnits - stock.reservedUnits;

      if (availableUnits < quantity) {
        return NextResponse.json({ error: "Not enough stock available" }, { status: 409 });
      }

      // Increment reservedUnits and create reservation atomically
      const [, reservation] = await prisma.$transaction([
        prisma.stock.update({
          where: { productId_warehouseId: { productId, warehouseId } },
          data: { reservedUnits: { increment: quantity } },
        }),
        prisma.reservation.create({
          data: {
            productId,
            warehouseId,
            quantity,
            status: "pending",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          },
        }),
      ]);

      return NextResponse.json(reservation, { status: 201 });
    } finally {
      // Always release the lock
      const current = await redis.get(lockKey);
      if (current === lockValue) {
        await redis.del(lockKey);
      }
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
  }
}