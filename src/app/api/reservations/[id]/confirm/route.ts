import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.status !== "pending") {
      return NextResponse.json({ error: "Reservation is no longer pending" }, { status: 400 });
    }

    if (new Date() > reservation.expiresAt) {
      // Release the stock back
      await prisma.$transaction([
        prisma.stock.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: { reservedUnits: { decrement: reservation.quantity } },
        }),
        prisma.reservation.update({
          where: { id },
          data: { status: "released" },
        }),
      ]);

      return NextResponse.json({ error: "Reservation has expired" }, { status: 410 });
    }

    // Confirm — decrement totalUnits and reservedUnits both
    const updated = await prisma.$transaction([
      prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          totalUnits: { decrement: reservation.quantity },
          reservedUnits: { decrement: reservation.quantity },
        },
      }),
      prisma.reservation.update({
        where: { id },
        data: { status: "confirmed" },
      }),
    ]);

    return NextResponse.json(updated[1]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to confirm reservation" }, { status: 500 });
  }
}