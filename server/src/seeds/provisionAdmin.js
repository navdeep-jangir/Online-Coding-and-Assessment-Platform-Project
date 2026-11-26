import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

/**
 * Safe standalone administrator provisioning script.
 * Usage: Set ADMIN_EMAIL, ADMIN_PASSWORD, and optional ADMIN_NAME in server/.env,
 * then run `npm run provision:admin`. Does NOT reset or reseed any other collections.
 */
async function provisionAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const name = String(process.env.ADMIN_NAME || 'CodeClimb Admin').trim();

  if (!email || !password || password.length < 8) {
    console.error(
      'ERROR: Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 characters) in server/.env before running provision:admin.'
    );
    process.exit(1);
  }

  await connectDB();

  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = 'admin';
    existing.isActive = true;
    existing.password = hashedPassword;
    if (name) existing.name = name;
    await existing.save();
    console.log(`Updated existing administrator account: ${email}`);
  } else {
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      collegeName: 'CodeClimb Platform',
      preferredLanguage: 'cpp',
      isActive: true,
    });
    console.log(`Provisioned new administrator account: ${email}`);
  }

  process.exit(0);
}

provisionAdmin().catch((err) => {
  console.error('Failed to provision administrator:', err);
  process.exit(1);
});
