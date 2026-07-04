import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.vendor.findMany();
  const seen = new Set();
  for (const v of vendors) {
    if (seen.has(v.name)) {
      console.log('Deleting duplicate:', v.name, v.id);
      await prisma.vendorMetricSnapshot.deleteMany({ where: { vendorId: v.id } });
      await prisma.vendor.delete({ where: { id: v.id } });
    } else {
      seen.add(v.name);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
