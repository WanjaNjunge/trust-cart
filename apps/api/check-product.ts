
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const product = await prisma.product.findUnique({
            where: { slug: 'macbook-air-m2' },
            select: { id: true, name: true, isActive: true, slug: true }
        });
        console.log(JSON.stringify(product, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
