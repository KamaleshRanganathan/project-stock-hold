import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const warehouse1 = await prisma.warehouse.create({
    data: { name: "Chennai Hub", location: "Chennai, Tamil Nadu" },
  });
  const warehouse2 = await prisma.warehouse.create({
    data: { name: "Mumbai Hub", location: "Mumbai, Maharashtra" },
  });
  const product1 = await prisma.product.create({
    data: {
      name: "Wireless Headphones",
      description: "Noise cancelling headphones",
      price: 2999,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    },
  });
  const product2 = await prisma.product.create({
    data: {
      name: "Mechanical Keyboard",
      description: "RGB mechanical keyboard",
      price: 4999,
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    },
  });
  const product3 = await prisma.product.create({
    data: {
      name: "USB-C Hub",
      description: "7-in-1 USB-C hub",
      price: 1499,
      imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&q=80",
    },
  });
  await prisma.stock.createMany({
    data: [
      { productId: product1.id, warehouseId: warehouse1.id, totalUnits: 10 },
      { productId: product1.id, warehouseId: warehouse2.id, totalUnits: 5 },
      { productId: product2.id, warehouseId: warehouse1.id, totalUnits: 3 },
      { productId: product2.id, warehouseId: warehouse2.id, totalUnits: 8 },
      { productId: product3.id, warehouseId: warehouse1.id, totalUnits: 2 },
      { productId: product3.id, warehouseId: warehouse2.id, totalUnits: 6 },
    ],
  });
  console.log("Seeded successfully");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });