import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@trustcart.co.ke';
    const newPassword = 'Test123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`Resetting password for ${email}...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: {
                passwordHash: hashedPassword,
                role: 'ADMIN', // Ensure role is correct
                isActive: true,
            },
        });
        console.log(`✅ Password reset successfully for user: ${user.email}`);
        console.log(`New credentials:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
    } catch (error) {
        console.error('❌ Failed to reset password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
