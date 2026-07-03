const bcrypt = require('bcrypt');
const { Role } = require('@prisma/client');
const prisma = require('../src/core/prisma');
const env = require('../src/core/env');

/**
 * Seeds one ADMIN and one EMPLOYEE.
 * Idempotent: re-running updates name/role/password for the seed emails
 * rather than creating duplicates. Credentials come from env (with
 * sensible local defaults defined in src/core/env.js).
 */
async function main() {
  const [adminHash, employeeHash] = await Promise.all([
    bcrypt.hash(env.SEED_ADMIN_PASSWORD, env.BCRYPT_SALT_ROUNDS),
    bcrypt.hash(env.SEED_EMPLOYEE_PASSWORD, env.BCRYPT_SALT_ROUNDS)
  ]);

  const admin = {
    name: env.SEED_ADMIN_NAME,
    email: env.SEED_ADMIN_EMAIL.toLowerCase(),
    role: Role.ADMIN
  };
  const employee = {
    name: env.SEED_EMPLOYEE_NAME,
    email: env.SEED_EMPLOYEE_EMAIL.toLowerCase(),
    role: Role.EMPLOYEE
  };

  await prisma.$transaction([
    prisma.user.upsert({
      where: { email: admin.email },
      update: { name: admin.name, role: admin.role, password: adminHash },
      create: { ...admin, password: adminHash }
    }),
    prisma.user.upsert({
      where: { email: employee.email },
      update: { name: employee.name, role: employee.role, password: employeeHash },
      create: { ...employee, password: employeeHash }
    })
  ]);

  console.log('Seed complete:');
  console.log(`  ADMIN    -> ${admin.email}`);
  console.log(`  EMPLOYEE -> ${employee.email}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
