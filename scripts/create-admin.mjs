import { createClient } from "@libsql/client";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

const url = process.env.ASTRO_DB_REMOTE_URL;
const authToken = process.env.ASTRO_DB_APP_TOKEN;
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] ?? "Admin";

if (!url || !authToken) {
  console.error("Missing ASTRO_DB_REMOTE_URL or ASTRO_DB_APP_TOKEN");
  process.exit(1);
}
if (!email || !password) {
  console.error("Usage: npm run db:create-admin <email> <password> [name]");
  process.exit(1);
}

const client = createClient({ url, authToken });

const now = new Date().toISOString();
const userId = randomUUID();
const hashed = await hashPassword(password);

// Check if an admin already exists
const existing = await client.execute("SELECT id FROM User WHERE role = 'admin' LIMIT 1");
if (existing.rows.length > 0) {
  console.log("An admin user already exists. Aborting.");
  process.exit(0);
}

await client.batch([
  {
    sql: `INSERT INTO User (id, name, email, emailVerified, role, createdAt, updatedAt)
          VALUES (?, ?, ?, 1, 'admin', ?, ?)`,
    args: [userId, name, email, now, now],
  },
  {
    sql: `INSERT INTO Account (id, userId, accountId, providerId, password, createdAt, updatedAt)
          VALUES (?, ?, ?, 'credential', ?, ?, ?)`,
    args: [randomUUID(), userId, userId, hashed, now, now],
  },
]);

console.log(`Admin created: ${email}`);
