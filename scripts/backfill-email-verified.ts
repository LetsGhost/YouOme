/**
 * One-time backfill: hard-gating login on emailVerifiedAt (see auth.service.ts login())
 * means every pre-existing user without that field becomes unable to log in the moment
 * that change ships. Run this once, before or atomically with the deploy that enables the
 * gate, to grandfather in every account that existed before email verification did:
 *
 *   npx ts-node --transpile-only scripts/backfill-email-verified.ts
 *
 * Idempotent - only touches documents where emailVerifiedAt is unset, so it's safe to
 * re-run.
 */
import mongoose from "mongoose";

import { env } from "../src/config/env";
import { connectDatabase } from "../src/bootstrap/database";
import { UserModel } from "../src/modules/user/model/user.model";

async function main() {
  await connectDatabase(env.MONGO_URI);

  const result = await UserModel.updateMany(
    { emailVerifiedAt: { $exists: false } },
    [{ $set: { emailVerifiedAt: "$createdAt" } }]
  );

  console.log(`Backfilled emailVerifiedAt on ${result.modifiedCount} existing user(s).`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
