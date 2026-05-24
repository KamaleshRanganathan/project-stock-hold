import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // Protect the cron route from public access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: "pending",
        expiresAt: { lt: new Date() },
      },
    });

    for (const reservation of expiredReservations) {
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
          where: { id: reservation.id },
          data: { status: "released" },
        }),
      ]);
    }

    return NextResponse.json({
      message: `Released ${expiredReservations.length} expired reservations`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to expire reservations" },
      { status: 500 }
    );
  }
}