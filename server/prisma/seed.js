const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
  await prisma.route.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      credits: 10000,
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'user@test.com',
      password: userPassword,
      name: 'Regular User',
      role: 'USER',
      credits: 100,
    },
  });

  // Create mock SMS routes
  await prisma.route.createMany({
    data: [
      { name: 'ROUTE_A', priority: 1, balance: 1000, failureRate: 0.3 },
      { name: 'ROUTE_B', priority: 2, balance: 500, failureRate: 0.2 },
      { name: 'ROUTE_C', priority: 3, balance: 300, failureRate: 0.1 },
    ],
  });

  // Create a sample group with contacts for the regular user
  const group = await prisma.group.create({
    data: { name: 'Test Contacts', userId: user.id },
  });

  const sampleContacts = [
    { name: 'Ram Sharma', phone: '9841234567' },
    { name: 'Sita Thapa', phone: '9851234567' },
    { name: 'Hari Adhikari', phone: '9801122334' },
    { name: 'Gita Bhandari', phone: '9812233445' },
    { name: 'Bishal KC', phone: '9867788990' },
    { name: 'Anita Rai', phone: '9845566778' },
    { name: 'Suresh Gurung', phone: '9823344556' },
    { name: 'Prabha Shrestha', phone: '9856677889' },
    { name: 'Dipak Tamang', phone: '9878899001' },
    { name: 'Mina Karki', phone: '9834455667' },
  ];

  for (const c of sampleContacts) {
    await prisma.contact.create({
      data: { ...c, groupId: group.id, userId: user.id },
    });
  }

  console.log('Seed complete:');
  console.log(`  Admin: admin@test.com / password123 (${admin.credits} credits)`);
  console.log(`  User:  user@test.com / password123 (${user.credits} credits)`);
  console.log(`  Routes: ROUTE_A, ROUTE_B, ROUTE_C`);
  console.log(`  Group: "${group.name}" with ${sampleContacts.length} contacts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
