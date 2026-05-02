import crypto from "crypto";
import { cookies } from "next/headers";

export const PAID_COOKIE = "ct_paid";
export const ACCOUNT_COOKIE = "ct_account";

export function createAccountId(seed: string) {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  return `acct_${hash.slice(0, 24)}`;
}

export async function getAccountIdFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCOUNT_COOKIE)?.value ?? null;
}

export async function hasPaidAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(PAID_COOKIE)?.value === "1";
}
