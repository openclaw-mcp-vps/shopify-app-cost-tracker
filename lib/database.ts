import { Pool } from "pg";

export type StoreRow = {
  id: number;
  accountId: string;
  shopDomain: string;
  accessToken: string;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
};

export type AppCostRow = {
  id: number;
  storeId: number;
  shopDomain: string;
  appGid: string;
  appName: string;
  developerName: string | null;
  planName: string | null;
  billingInterval: string | null;
  priceAmount: number;
  currencyCode: string;
  monthlyUsd: number;
  previousMonthlyUsd: number | null;
  category: string;
  active: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SyncedAppCost = {
  appGid: string;
  appName: string;
  developerName: string | null;
  planName: string | null;
  billingInterval: string | null;
  priceAmount: number;
  currencyCode: string;
  monthlyUsd: number;
  category: string;
};

let pool: Pool | null = null;
let schemaInitPromise: Promise<void> | null = null;

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to use the cost tracker tool.");
  }

  pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false }
  });

  return pool;
}

async function initSchema() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id BIGSERIAL PRIMARY KEY,
      account_id TEXT NOT NULL,
      shop_domain TEXT NOT NULL,
      access_token TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_synced_at TIMESTAMPTZ,
      UNIQUE(account_id, shop_domain)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS app_subscriptions (
      id BIGSERIAL PRIMARY KEY,
      store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      app_gid TEXT NOT NULL,
      app_name TEXT NOT NULL,
      developer_name TEXT,
      plan_name TEXT,
      billing_interval TEXT,
      price_amount NUMERIC(12, 2) NOT NULL,
      currency_code TEXT NOT NULL,
      monthly_usd NUMERIC(12, 2) NOT NULL,
      previous_monthly_usd NUMERIC(12, 2),
      category TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(store_id, app_gid)
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_stores_account_id ON stores(account_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_app_subscriptions_store_id ON app_subscriptions(store_id);
  `);
}

export async function ensureDatabase() {
  if (!schemaInitPromise) {
    schemaInitPromise = initSchema();
  }
  await schemaInitPromise;
}

export async function upsertStore(input: {
  accountId: string;
  shopDomain: string;
  accessToken: string;
}): Promise<StoreRow> {
  await ensureDatabase();
  const db = getPool();

  const result = await db.query(
    `
    INSERT INTO stores (account_id, shop_domain, access_token)
    VALUES ($1, $2, $3)
    ON CONFLICT (account_id, shop_domain)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      updated_at = NOW()
    RETURNING *;
    `,
    [input.accountId, input.shopDomain, input.accessToken]
  );

  return mapStore(result.rows[0]);
}

export async function touchStoreSync(storeId: number) {
  await ensureDatabase();
  const db = getPool();
  await db.query(
    `UPDATE stores SET last_synced_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [storeId]
  );
}

export async function listStores(accountId: string): Promise<StoreRow[]> {
  await ensureDatabase();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM stores WHERE account_id = $1 ORDER BY updated_at DESC`,
    [accountId]
  );

  return result.rows.map(mapStore);
}

export async function deleteStore(accountId: string, shopDomain: string) {
  await ensureDatabase();
  const db = getPool();
  await db.query(`DELETE FROM stores WHERE account_id = $1 AND shop_domain = $2`, [accountId, shopDomain]);
}

export async function deleteStoreByDomain(shopDomain: string) {
  await ensureDatabase();
  const db = getPool();
  await db.query(`DELETE FROM stores WHERE shop_domain = $1`, [shopDomain]);
}

export async function getStoreByDomain(accountId: string, shopDomain: string): Promise<StoreRow | null> {
  await ensureDatabase();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM stores WHERE account_id = $1 AND shop_domain = $2 LIMIT 1`,
    [accountId, shopDomain]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapStore(result.rows[0]);
}

export async function syncStoreAppCosts(storeId: number, apps: SyncedAppCost[]) {
  await ensureDatabase();
  const db = getPool();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(`UPDATE app_subscriptions SET active = FALSE, updated_at = NOW() WHERE store_id = $1`, [
      storeId
    ]);

    for (const app of apps) {
      await client.query(
        `
        INSERT INTO app_subscriptions (
          store_id,
          app_gid,
          app_name,
          developer_name,
          plan_name,
          billing_interval,
          price_amount,
          currency_code,
          monthly_usd,
          previous_monthly_usd,
          category,
          active,
          last_seen_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, $10, TRUE, NOW(), NOW()
        )
        ON CONFLICT (store_id, app_gid)
        DO UPDATE SET
          app_name = EXCLUDED.app_name,
          developer_name = EXCLUDED.developer_name,
          plan_name = EXCLUDED.plan_name,
          billing_interval = EXCLUDED.billing_interval,
          price_amount = EXCLUDED.price_amount,
          currency_code = EXCLUDED.currency_code,
          previous_monthly_usd = app_subscriptions.monthly_usd,
          monthly_usd = EXCLUDED.monthly_usd,
          category = EXCLUDED.category,
          active = TRUE,
          last_seen_at = NOW(),
          updated_at = NOW();
        `,
        [
          storeId,
          app.appGid,
          app.appName,
          app.developerName,
          app.planName,
          app.billingInterval,
          app.priceAmount,
          app.currencyCode,
          app.monthlyUsd,
          app.category
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await touchStoreSync(storeId);
}

export async function listAccountAppCosts(accountId: string): Promise<AppCostRow[]> {
  await ensureDatabase();
  const db = getPool();
  const result = await db.query(
    `
      SELECT
        a.*,
        s.shop_domain
      FROM app_subscriptions a
      JOIN stores s ON s.id = a.store_id
      WHERE s.account_id = $1
      ORDER BY a.monthly_usd DESC, a.updated_at DESC
    `,
    [accountId]
  );

  return result.rows.map(mapApp);
}

export function mapStore(row: Record<string, unknown>): StoreRow {
  return {
    id: Number(row.id),
    accountId: String(row.account_id),
    shopDomain: String(row.shop_domain),
    accessToken: String(row.access_token),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    lastSyncedAt: row.last_synced_at ? new Date(String(row.last_synced_at)).toISOString() : null
  };
}

function mapApp(row: Record<string, unknown>): AppCostRow {
  return {
    id: Number(row.id),
    storeId: Number(row.store_id),
    shopDomain: String(row.shop_domain),
    appGid: String(row.app_gid),
    appName: String(row.app_name),
    developerName: row.developer_name ? String(row.developer_name) : null,
    planName: row.plan_name ? String(row.plan_name) : null,
    billingInterval: row.billing_interval ? String(row.billing_interval) : null,
    priceAmount: Number(row.price_amount),
    currencyCode: String(row.currency_code),
    monthlyUsd: Number(row.monthly_usd),
    previousMonthlyUsd: row.previous_monthly_usd !== null ? Number(row.previous_monthly_usd) : null,
    category: String(row.category),
    active: Boolean(row.active),
    lastSeenAt: new Date(String(row.last_seen_at)).toISOString(),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}
