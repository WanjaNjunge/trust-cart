import { PrismaClient, UserRole, ProductCondition, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ImageKit base URL for product and category images
  const IMAGEKIT_BASE = 'https://ik.imagekit.io/nr5uqiflj/trustcart';

  // Hash at runtime so we always get a valid hash — never rely on hardcoded strings
  const TEST_PASSWORD = 'Test123!';
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // ===========================================
  // 1. USERS
  // ===========================================
  console.log('Creating users...');

  await prisma.user.upsert({
    where: { email: 'admin@trustcart.co.ke' },
    update: { passwordHash }, // Keep password in sync on every seed run
    create: {
      email: 'admin@trustcart.co.ke',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      phone: '254700000001',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@trustcart.co.ke' },
    update: { passwordHash },
    create: {
      email: 'manager@trustcart.co.ke',
      passwordHash,
      firstName: 'Manager',
      lastName: 'User',
      phone: '254700000002',
      role: UserRole.MANAGER,
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@trustcart.co.ke' },
    update: { passwordHash },
    create: {
      email: 'staff@trustcart.co.ke',
      passwordHash,
      firstName: 'Staff',
      lastName: 'User',
      phone: '254700000003',
      role: UserRole.STAFF,
      isActive: true,
      emailVerified: true,
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: { passwordHash },
    create: {
      email: 'john.doe@example.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      phone: '254712345678',
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: true,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'jane.wanjiku@example.com' },
    update: { passwordHash },
    create: {
      email: 'jane.wanjiku@example.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Wanjiku',
      phone: '254798765432',
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`  ✓ Created 5 users`);

  // ===========================================
  // 2. ADDRESSES
  // ===========================================
  console.log('Creating addresses...');

  await prisma.address.createMany({
    data: [
      {
        userId: customer1.id,
        label: 'Home',
        recipientName: 'John Doe',
        phone: '254712345678',
        line1: 'Kimathi Street',
        line2: 'Apt 5B',
        city: 'Nairobi',
        county: 'Nairobi',
        isDefault: true,
      },
      {
        userId: customer2.id,
        label: 'Home',
        recipientName: 'Jane Wanjiku',
        phone: '254798765432',
        line1: 'Mombasa Road',
        city: 'Nairobi',
        county: 'Nairobi',
        isDefault: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`  ✓ Created 2 addresses`);

  // ===========================================
  // 3. CATEGORIES
  // ===========================================
  console.log('Creating categories...');

  const laptops = await prisma.category.upsert({
    where: { slug: 'laptops' },
    update: {},
    create: {
      name: 'Laptops',
      slug: 'laptops',
      description: 'Portable computers',
      imageUrl: `${IMAGEKIT_BASE}/banners/banner-laptops.png`,
      sortOrder: 1,
      isActive: true,
    },
  });

  const phones = await prisma.category.upsert({
    where: { slug: 'phones' },
    update: {},
    create: {
      name: 'Phones',
      slug: 'phones',
      description: 'Smartphones',
      imageUrl: `${IMAGEKIT_BASE}/banners/banner-phones.png`,
      sortOrder: 2,
      isActive: true,
    },
  });

  const tablets = await prisma.category.upsert({
    where: { slug: 'tablets' },
    update: {},
    create: {
      name: 'Tablets',
      slug: 'tablets',
      description: 'Tablet computers',
      imageUrl: `${IMAGEKIT_BASE}/banners/banner-tablets.png`,
      sortOrder: 3,
      isActive: true,
    },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Add-ons',
      imageUrl: `${IMAGEKIT_BASE}/banners/banner-accessories.png`,
      sortOrder: 4,
      isActive: true,
    },
  });

  const monitors = await prisma.category.upsert({
    where: { slug: 'monitors' },
    update: {},
    create: {
      name: 'Monitors',
      slug: 'monitors',
      description: 'Displays',
      imageUrl: `${IMAGEKIT_BASE}/banners/banner-laptops.png`,
      sortOrder: 5,
      isActive: true,
    },
  });

  console.log(`  ✓ Created 5 categories`);

  // ===========================================
  // 4. BRANDS
  // ===========================================
  console.log('Creating brands...');

  const hp = await prisma.brand.upsert({
    where: { slug: 'hp' },
    update: {},
    create: { name: 'HP', slug: 'hp', isActive: true },
  });

  const dell = await prisma.brand.upsert({
    where: { slug: 'dell' },
    update: {},
    create: { name: 'Dell', slug: 'dell', isActive: true },
  });

  const apple = await prisma.brand.upsert({
    where: { slug: 'apple' },
    update: {},
    create: { name: 'Apple', slug: 'apple', isActive: true },
  });

  const lenovo = await prisma.brand.upsert({
    where: { slug: 'lenovo' },
    update: {},
    create: { name: 'Lenovo', slug: 'lenovo', isActive: true },
  });

  const samsung = await prisma.brand.upsert({
    where: { slug: 'samsung' },
    update: {},
    create: { name: 'Samsung', slug: 'samsung', isActive: true },
  });

  console.log(`  ✓ Created 5 brands`);

  // ===========================================
  // 5. PRODUCTS
  // ===========================================
  console.log('Creating products...');

  const products = [
    {
      sku: 'HP-EB840-G6',
      name: 'HP EliteBook 840 G6',
      slug: 'hp-elitebook-840-g6',
      description: 'Business laptop with Intel Core i5, 16GB RAM',
      price: 45990,
      condition: ProductCondition.EX_UK,
      categoryId: laptops.id,
      brandId: hp.id,
      warrantyMonths: 6,
      isActive: true,
      isFeatured: true,
    },
    {
      sku: 'DELL-LAT-5520',
      name: 'Dell Latitude 5520',
      slug: 'dell-latitude-5520',
      description: 'Enterprise laptop with Intel Core i5',
      price: 48990,
      condition: ProductCondition.EX_UK,
      categoryId: laptops.id,
      brandId: dell.id,
      warrantyMonths: 6,
      isActive: true,
      isFeatured: true,
    },
    {
      sku: 'APPLE-MBA-M2',
      name: 'MacBook Air M2',
      slug: 'macbook-air-m2',
      description: 'Apple M2 chip, 8GB RAM, 256GB SSD',
      price: 149990,
      condition: ProductCondition.BRAND_NEW,
      categoryId: laptops.id,
      brandId: apple.id,
      warrantyMonths: 12,
      isActive: true,
      isFeatured: true,
    },
    {
      sku: 'LEN-T480',
      name: 'Lenovo ThinkPad T480',
      slug: 'lenovo-thinkpad-t480',
      description: 'Classic ThinkPad with Intel Core i5',
      price: 35990,
      condition: ProductCondition.EX_UK,
      categoryId: laptops.id,
      brandId: lenovo.id,
      warrantyMonths: 6,
      isActive: true,
      isFeatured: false,
    },
    {
      sku: 'APPLE-IP15',
      name: 'iPhone 15 128GB',
      slug: 'iphone-15-128gb',
      description: 'A16 Bionic chip, 128GB storage',
      price: 134990,
      condition: ProductCondition.BRAND_NEW,
      categoryId: phones.id,
      brandId: apple.id,
      warrantyMonths: 12,
      isActive: true,
      isFeatured: true,
    },
    {
      sku: 'SAM-S24U',
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: '256GB, S Pen included',
      price: 179990,
      condition: ProductCondition.BRAND_NEW,
      categoryId: phones.id,
      brandId: samsung.id,
      warrantyMonths: 12,
      isActive: true,
      isFeatured: true,
    },
    {
      sku: 'APPLE-IPAD10',
      name: 'iPad 10th Gen 64GB',
      slug: 'ipad-10th-gen',
      description: 'A14 Bionic, 10.9" display',
      price: 54990,
      condition: ProductCondition.BRAND_NEW,
      categoryId: tablets.id,
      brandId: apple.id,
      warrantyMonths: 12,
      isActive: true,
      isFeatured: false,
    },
    {
      sku: 'SAM-TABS9',
      name: 'Samsung Galaxy Tab S9',
      slug: 'samsung-tab-s9',
      description: '11" AMOLED, 128GB',
      price: 89990,
      condition: ProductCondition.BRAND_NEW,
      categoryId: tablets.id,
      brandId: samsung.id,
      warrantyMonths: 12,
      isActive: true,
      isFeatured: false,
    },
    {
      sku: 'ACC-USBHUB',
      name: 'USB-C Hub 7-in-1',
      slug: 'usb-c-hub-7in1',
      description: 'HDMI, USB 3.0, SD Card adapter',
      price: 3990,
      condition: ProductCondition.BRAND_NEW,
      categoryId: accessories.id,
      brandId: null,
      warrantyMonths: 3,
      isActive: true,
      isFeatured: false,
    },
    {
      sku: 'DELL-U2722D',
      name: 'Dell UltraSharp 27" 4K',
      slug: 'dell-u2722d',
      description: '27" 4K USB-C Hub Monitor',
      price: 65990,
      condition: ProductCondition.BRAND_NEW,
      categoryId: monitors.id,
      brandId: dell.id,
      warrantyMonths: 12,
      isActive: true,
      isFeatured: false,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log(`  ✓ Created ${products.length} products`);

  // ===========================================
  // 5.1 PRODUCT IMAGES
  // ===========================================
  console.log('Creating product images...');

  const allProducts = await prisma.product.findMany();

  // Map of product SKUs to their ImageKit image paths
  const productImageMap: Record<string, string> = {
    'APPLE-MBA-M2': `${IMAGEKIT_BASE}/products/macbook-air-m2.png`,
    'APPLE-IP15': `${IMAGEKIT_BASE}/products/iphone-15.png`,
    'SAM-S24U': `${IMAGEKIT_BASE}/products/samsung-s24-ultra.png`,
    'DELL-U2722D': `${IMAGEKIT_BASE}/products/dell-ultrasharp-27.png`,
    // Fallback images for products without specific images
    'HP-EB840-G6': `${IMAGEKIT_BASE}/products/macbook-air-m2.png`,
    'DELL-LAT-5520': `${IMAGEKIT_BASE}/products/macbook-air-m2.png`,
    'LEN-T480': `${IMAGEKIT_BASE}/products/macbook-air-m2.png`,
    'APPLE-IPAD10': `${IMAGEKIT_BASE}/products/iphone-15.png`,
    'SAM-TABS9': `${IMAGEKIT_BASE}/products/samsung-s24-ultra.png`,
    'ACC-USBHUB': `${IMAGEKIT_BASE}/products/dell-ultrasharp-27.png`,
  };

  for (const product of allProducts) {
    const imageUrl = productImageMap[product.sku] || `${IMAGEKIT_BASE}/products/macbook-air-m2.png`;

    // Check if image already exists
    const existingImage = await prisma.productImage.findFirst({
      where: { productId: product.id, isPrimary: true },
    });

    if (!existingImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrl,
          altText: product.name,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }
  }

  console.log(`  ✓ Created ${allProducts.length} product images`);

  // ===========================================
  // 6. INVENTORY RECORDS
  // ===========================================

  console.log('Creating inventory records...');

  for (const product of allProducts) {
    await prisma.inventoryRecord.upsert({
      where: { productId: product.id },
      update: { quantityOnHand: 20, quantityReserved: 0 }, // reset stock on every seed run
      create: {
        productId: product.id,
        quantityOnHand: 20,
        quantityReserved: 0,
        reorderThreshold: 5,
      },
    });
  }

  console.log(`  ✓ Created ${allProducts.length} inventory records`);

  // ===========================================
  // 7. DELIVERY PROVIDERS
  // ===========================================
  console.log('Creating delivery providers...');

  await prisma.deliveryProvider.upsert({
    where: { code: 'SENDY' },
    update: {},
    create: { name: 'Sendy', code: 'SENDY', contactPhone: '254700123456', isActive: true },
  });

  await prisma.deliveryProvider.upsert({
    where: { code: 'GLOVO' },
    update: {},
    create: { name: 'Glovo', code: 'GLOVO', contactPhone: '254700654321', isActive: true },
  });

  console.log(`  ✓ Created 2 delivery providers`);

  // ===========================================
  // 8. PROMO CODES
  // ===========================================
  console.log('Creating promo codes...');

  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      minOrderValue: 5000,
      maxUsageTotal: 1000,
      maxUsagePerCustomer: 1,
      startsAt: now,
      expiresAt: oneMonthLater,
      isActive: true,
    },
  });

  await prisma.promoCode.upsert({
    where: { code: 'SAVE5K' },
    update: {},
    create: {
      code: 'SAVE5K',
      discountType: DiscountType.FIXED,
      discountValue: 5000,
      minOrderValue: 50000,
      maxUsageTotal: 500,
      maxUsagePerCustomer: 2,
      startsAt: now,
      expiresAt: oneMonthLater,
      isActive: true,
    },
  });

  await prisma.promoCode.upsert({
    where: { code: 'FREEDELIVERY' },
    update: {},
    create: {
      code: 'FREEDELIVERY',
      discountType: DiscountType.FREE_DELIVERY,
      discountValue: 0,
      minOrderValue: 10000,
      maxUsageTotal: 200,
      maxUsagePerCustomer: 3,
      startsAt: now,
      expiresAt: oneMonthLater,
      isActive: true,
    },
  });

  console.log(`  ✓ Created 3 promo codes`);

  // ===========================================
  // SUMMARY
  // ===========================================
  console.log('\n✅ Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Summary:');
  console.log('  • 5 Users (1 admin, 1 manager, 1 staff, 2 customers)');
  console.log('  • 2 Addresses');
  console.log('  • 5 Categories');
  console.log('  • 5 Brands');
  console.log(`  • ${products.length} Products`);
  console.log(`  • ${allProducts.length} Inventory Records`);
  console.log('  • 2 Delivery Providers');
  console.log('  • 3 Promo Codes');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test credentials: any email with password "Test123!"');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    throw e;
  });
