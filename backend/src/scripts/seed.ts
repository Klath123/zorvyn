import 'dotenv/config';
import { PrismaClient, TransactionType, TransactionStatus, PaymentChannel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Realistic transaction categories per type
const transactionData: {
  type: TransactionType;
  categories: string[];
  channels: PaymentChannel[];
}[] = [
  {
    type: 'INCOME',
    categories: ['sales', 'subscription_revenue', 'investor_funding', 'consulting_fees', 'licensing_revenue'],
    channels: ['UPI', 'CARD', 'NETBANKING', 'BANK_TRANSFER'],
  },
  {
    type: 'EXPENSE',
    categories: ['salary', 'rent', 'vendor_payment', 'advertising', 'software_subscriptions', 'infrastructure', 'legal_compliance'],
    channels: ['BANK_TRANSFER', 'CARD', 'NETBANKING'],
  },
  {
    type: 'REFUND',
    categories: ['customer_refund', 'payment_gateway_refund', 'vendor_refund'],
    channels: ['UPI', 'CARD', 'NETBANKING'],
  },
  {
    type: 'FEE',
    categories: ['payment_gateway_fee', 'bank_fee', 'transaction_fee', 'compliance_fee'],
    channels: ['BANK_TRANSFER', 'CARD'],
  },
];

const statusWeights: { status: TransactionStatus; weight: number }[] = [
  { status: 'SETTLED', weight: 0.80 },
  { status: 'PENDING', weight: 0.15 },
  { status: 'REVERSED', weight: 0.05 },
];

function weightedStatus(): TransactionStatus {
  const r = Math.random();
  let cumulative = 0;
  for (const { status, weight } of statusWeights) {
    cumulative += weight;
    if (r < cumulative) return status;
  }
  return 'SETTLED';
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(monthsBack: number): Date {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - monthsBack);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const notesMap: Record<string, string[]> = {
  sales: ['B2B SaaS license sale', 'Enterprise deal closure', 'Quarterly bulk payment received'],
  subscription_revenue: ['Monthly SaaS subscriptions', 'Annual plan renewals', 'Pro tier upgrade batch'],
  investor_funding: ['Seed round tranche', 'Angel investor payment', 'Bridge funding received'],
  salary: ['Monthly payroll disbursement', 'Engineering team salaries', 'Operations team payroll'],
  rent: ['Office rent — Bangalore HQ', 'Server room lease payment', 'Co-working space fee'],
  vendor_payment: ['AWS infrastructure billing', 'Third-party API services', 'Cloud storage vendor'],
  advertising: ['Google Ads campaign', 'LinkedIn sponsored posts', 'Performance marketing spend'],
  payment_gateway_fee: ['Razorpay processing fee', 'Stripe transaction charges', 'PayU gateway fee'],
  customer_refund: ['Cancelled subscription refund', 'Disputed charge reversal', 'Accidental duplicate refund'],
};

function getNote(category: string): string {
  const notes = notesMap[category];
  if (notes) return pick(notes);
  return `${category.replace(/_/g, ' ')} transaction`;
}

async function seed() {
  console.log('🌱 Seeding Zorvyn FinanceOps database...\n');

  // ── Roles ──────────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'VIEWER' },
      update: {},
      create: { name: 'VIEWER', description: 'Finance clerk — read-only access to records and basic summary' },
    }),
    prisma.role.upsert({
      where: { name: 'ANALYST' },
      update: {},
      create: { name: 'ANALYST', description: 'Finance analyst — access to records, cashflow, categories, anomalies' },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Finance manager — full CRUD + user management + all dashboard access' },
    }),
  ]);

  console.log('✅ Roles created: VIEWER, ANALYST, ADMIN');

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123', 12);

  const usersData = [
    { email: 'admin@zorvyn.com', name: 'Arjun Mehta', roleName: 'ADMIN' },
    { email: 'analyst@zorvyn.com', name: 'Priya Sharma', roleName: 'ANALYST' },
    { email: 'viewer@zorvyn.com', name: 'Rahul Gupta', roleName: 'VIEWER' },
    { email: 'analyst2@zorvyn.com', name: 'Sneha Iyer', roleName: 'ANALYST' },
  ];

  const createdUsers = [];
  for (const ud of usersData) {
    const role = roles.find((r) => r.name === ud.roleName)!;
    const user = await prisma.user.upsert({
      where: { email: ud.email },
      update: {},
      create: {
        email: ud.email,
        passwordHash,
        name: ud.name,
        userRoles: { create: { roleId: role.id } },
      },
    });
    createdUsers.push(user);
    console.log(`✅ User: ${ud.email} (${ud.roleName}) — password: Password123`);
  }

  // ── Financial Records ──────────────────────────────────────────────────────
  console.log('\n📊 Seeding financial records...');

  const adminUser = createdUsers[0];
  const analystUser = createdUsers[1];
  const recordsToCreate = [];

  // Generate ~120 realistic records over 6 months
  for (let i = 0; i < 120; i++) {
    const txGroup = pick(transactionData);

    // Weight income heavier (startup earns more than it refunds/fees)
    const typeWeights = [
      { group: transactionData[0], w: 0.40 }, // INCOME
      { group: transactionData[1], w: 0.45 }, // EXPENSE
      { group: transactionData[2], w: 0.08 }, // REFUND
      { group: transactionData[3], w: 0.07 }, // FEE
    ];

    const r = Math.random();
    let cum = 0;
    let chosen = transactionData[0];
    for (const tw of typeWeights) {
      cum += tw.w;
      if (r < cum) { chosen = tw.group; break; }
    }

    const category = pick(chosen.categories);
    const channel = pick(chosen.channels);

    // Amount ranges by type
    const amountRanges: Record<TransactionType, [number, number]> = {
      INCOME: [5000, 150000],
      EXPENSE: [2000, 80000],
      REFUND: [500, 15000],
      FEE: [100, 5000],
    };
    const [min, max] = amountRanges[chosen.type];
    const amount = randomBetween(min, max);

    // Inject a few anomalous high-value transactions
    const isAnomaly = i < 5;
    const finalAmount = isAnomaly ? randomBetween(200000, 500000) : amount;

    recordsToCreate.push({
      userId: i % 3 === 0 ? analystUser.id : adminUser.id,
      amount: finalAmount,
      type: chosen.type,
      category,
      date: randomDate(6),
      notes: getNote(category),
      status: weightedStatus(),
      channel,
    });
  }

  await prisma.financialRecord.createMany({ data: recordsToCreate });
  console.log(`✅ Created ${recordsToCreate.length} financial records`);

  // ── Final summary ──────────────────────────────────────────────────────────
  const counts = await prisma.financialRecord.groupBy({
    by: ['type'],
    _count: { id: true },
    _sum: { amount: true },
  });

  console.log('\n📈 Seed summary:');
  for (const c of counts) {
    console.log(`   ${c.type}: ${c._count.id} records | ₹${(c._sum.amount || 0).toLocaleString('en-IN')}`);
  }

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Login credentials:');
  console.log('  admin@zorvyn.com   / Password123  (ADMIN)');
  console.log('  analyst@zorvyn.com / Password123  (ANALYST)');
  console.log('  viewer@zorvyn.com  / Password123  (VIEWER)');
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
