import crypto from "crypto";
import { z } from "zod";
import type { SyncedAppCost } from "@/lib/database";

const appInstallationsQuery = `
query AppInstallationsWithBilling {
  appInstallations(first: 100) {
    nodes {
      id
      app {
        id
        title
        developerName
      }
      activeSubscriptions {
        id
        name
        status
        lineItems {
          plan {
            pricingDetails {
              __typename
              ... on AppRecurringPricing {
                interval
                price {
                  amount
                  currencyCode
                }
              }
              ... on AppUsagePricing {
                terms
                cappedAmount {
                  amount
                  currencyCode
                }
              }
              ... on AppOneTimePricing {
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const singleAppFallbackQuery = `
query CurrentAppInstall {
  currentAppInstallation {
    id
    activeSubscriptions {
      id
      name
      status
      lineItems {
        plan {
          pricingDetails {
            __typename
            ... on AppRecurringPricing {
              interval
              price {
                amount
                currencyCode
              }
            }
            ... on AppOneTimePricing {
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
}
`;

const tokenResponseSchema = z.object({
  access_token: z.string().min(5),
  scope: z.string().optional(),
  associated_user_scope: z.string().optional()
});

const defaultScopes = "read_apps";

const fxRatesToUsd: Record<string, number> = {
  USD: 1,
  EUR: 1.09,
  GBP: 1.26,
  CAD: 0.73,
  AUD: 0.65,
  NZD: 0.59,
  JPY: 0.0066,
  INR: 0.012,
  SGD: 0.74,
  CHF: 1.1
};

export function getShopifyScopes() {
  return process.env.SHOPIFY_SCOPES?.trim() || defaultScopes;
}

export function normalizeShopDomain(input: string) {
  const raw = input.trim().toLowerCase();
  const stripped = raw
    .replace(/^https?:\/\//, "")
    .replace(/\/.*/, "")
    .replace(/\?.*/, "");

  if (!stripped.endsWith(".myshopify.com")) {
    throw new Error("Shop domain must end with .myshopify.com");
  }

  return stripped;
}

export function getShopifyAppConfig() {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const appUrl = process.env.SHOPIFY_APP_URL;

  if (!apiKey || !apiSecret || !appUrl) {
    throw new Error("Missing Shopify env vars: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL");
  }

  return { apiKey, apiSecret, appUrl };
}

export function createNonce() {
  return crypto.randomBytes(16).toString("hex");
}

export function buildInstallUrl(shop: string, state: string) {
  const { apiKey, appUrl } = getShopifyAppConfig();
  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/shopify`;
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: getShopifyScopes(),
    redirect_uri: redirectUri,
    state
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export function verifyHmac(searchParams: URLSearchParams) {
  const { apiSecret } = getShopifyAppConfig();

  const supplied = searchParams.get("hmac");
  if (!supplied) {
    return false;
  }

  const pairs = [...searchParams.entries()]
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const digest = crypto.createHmac("sha256", apiSecret).update(pairs).digest("hex");

  const digestBuffer = Buffer.from(digest, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");

  if (digestBuffer.length !== suppliedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, suppliedBuffer);
}

export async function exchangeCodeForAccessToken(input: { shop: string; code: string }) {
  const { apiKey, apiSecret } = getShopifyAppConfig();

  const response = await fetch(`https://${input.shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code: input.code
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed OAuth token exchange (${response.status})`);
  }

  const payload = await response.json();
  return tokenResponseSchema.parse(payload);
}

type GraphQLResponse = {
  data?: {
    appInstallations?: {
      nodes: Array<{
        id: string;
        app?: {
          id?: string;
          title?: string;
          developerName?: string;
        };
        activeSubscriptions?: Array<{
          id?: string;
          name?: string;
          status?: string;
          lineItems?: Array<{
            plan?: {
              pricingDetails?: {
                __typename?: string;
                interval?: string;
                price?: {
                  amount?: string;
                  currencyCode?: string;
                };
                cappedAmount?: {
                  amount?: string;
                  currencyCode?: string;
                };
              };
            };
          }>;
        }>;
      }>;
    };
    currentAppInstallation?: {
      id?: string;
      activeSubscriptions?: Array<{
        id?: string;
        name?: string;
        status?: string;
        lineItems?: Array<{
          plan?: {
            pricingDetails?: {
              __typename?: string;
              interval?: string;
              price?: {
                amount?: string;
                currencyCode?: string;
              };
            };
          };
        }>;
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

export async function fetchStoreAppCosts(shop: string, accessToken: string): Promise<SyncedAppCost[]> {
  const fullData = await graphqlRequest(shop, accessToken, appInstallationsQuery);

  if (!fullData.errors?.length && fullData.data?.appInstallations?.nodes?.length) {
    return normalizeAppsFromInstallations(fullData.data.appInstallations.nodes);
  }

  const fallbackData = await graphqlRequest(shop, accessToken, singleAppFallbackQuery);
  if (fallbackData.errors?.length) {
    const details = fallbackData.errors.map((error) => error.message || "Unknown").join("; ");
    throw new Error(`Shopify GraphQL error: ${details}`);
  }

  if (!fallbackData.data?.currentAppInstallation?.activeSubscriptions?.length) {
    return [];
  }

  return normalizeFromCurrentInstallation(fallbackData.data.currentAppInstallation);
}

async function graphqlRequest(shop: string, accessToken: string, query: string): Promise<GraphQLResponse> {
  const response = await fetch(`https://${shop}/admin/api/2026-04/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify({ query }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Shopify API request failed (${response.status})`);
  }

  return (await response.json()) as GraphQLResponse;
}

function normalizeAppsFromInstallations(
  installations: Array<{
    id: string;
    app?: { id?: string; title?: string; developerName?: string };
    activeSubscriptions?: Array<{
      id?: string;
      name?: string;
      status?: string;
      lineItems?: Array<{
        plan?: {
          pricingDetails?: {
            __typename?: string;
            interval?: string;
            price?: { amount?: string; currencyCode?: string };
            cappedAmount?: { amount?: string; currencyCode?: string };
          };
        };
      }>;
    }>;
  }>
): SyncedAppCost[] {
  const results: SyncedAppCost[] = [];

  for (const installation of installations) {
    const appTitle = installation.app?.title || "Unknown App";
    const appDeveloper = installation.app?.developerName || null;
    const appGid = installation.app?.id || installation.id;

    for (const subscription of installation.activeSubscriptions || []) {
      const pricingDetails = subscription.lineItems?.[0]?.plan?.pricingDetails;
      if (!pricingDetails) {
        continue;
      }

      const pricePayload = pricingDetails.price ?? pricingDetails.cappedAmount;
      const amount = Number(pricePayload?.amount || 0);
      const currencyCode = (pricePayload?.currencyCode || "USD").toUpperCase();
      const interval = pricingDetails.interval || null;
      const monthlyUsd = toMonthlyUsd(amount, currencyCode, interval);

      if (monthlyUsd <= 0) {
        continue;
      }

      results.push({
        appGid,
        appName: appTitle,
        developerName: appDeveloper,
        planName: subscription.name || null,
        billingInterval: interval,
        priceAmount: round2(amount),
        currencyCode,
        monthlyUsd: round2(monthlyUsd),
        category: inferCategory(appTitle)
      });
    }
  }

  return collapseDuplicateApps(results);
}

function normalizeFromCurrentInstallation(current: {
  id?: string;
  activeSubscriptions?: Array<{
    id?: string;
    name?: string;
    status?: string;
    lineItems?: Array<{
      plan?: {
        pricingDetails?: {
          __typename?: string;
          interval?: string;
          price?: { amount?: string; currencyCode?: string };
        };
      };
    }>;
  }>;
}): SyncedAppCost[] {
  const appGid = current.id || "gid://shopify/AppInstallation/current";
  const appName = "Current App Installation";

  const normalized: SyncedAppCost[] = [];

  for (const subscription of current.activeSubscriptions || []) {
    const pricing = subscription.lineItems?.[0]?.plan?.pricingDetails;
    const amount = Number(pricing?.price?.amount || 0);
    const currencyCode = (pricing?.price?.currencyCode || "USD").toUpperCase();
    const interval = pricing?.interval || null;

    normalized.push({
      appGid,
      appName,
      developerName: "Shopify App",
      planName: subscription.name || null,
      billingInterval: interval,
      priceAmount: round2(amount),
      currencyCode,
      monthlyUsd: round2(toMonthlyUsd(amount, currencyCode, interval)),
      category: "operations"
    });
  }

  return collapseDuplicateApps(normalized);
}

function collapseDuplicateApps(items: SyncedAppCost[]) {
  const byApp = new Map<string, SyncedAppCost>();

  for (const item of items) {
    const existing = byApp.get(item.appGid);
    if (!existing) {
      byApp.set(item.appGid, item);
      continue;
    }

    byApp.set(item.appGid, {
      ...existing,
      monthlyUsd: round2(existing.monthlyUsd + item.monthlyUsd),
      priceAmount: round2(existing.priceAmount + item.priceAmount)
    });
  }

  return [...byApp.values()];
}

function toMonthlyUsd(amount: number, currencyCode: string, interval: string | null) {
  const usdAmount = amount * (fxRatesToUsd[currencyCode] ?? 1);

  if (!interval) {
    return usdAmount;
  }

  const normalizedInterval = interval.toUpperCase();

  if (normalizedInterval.includes("ANNUAL") || normalizedInterval.includes("YEAR")) {
    return usdAmount / 12;
  }

  if (normalizedInterval.includes("WEEK")) {
    return usdAmount * 4.33;
  }

  if (normalizedInterval.includes("DAY")) {
    return usdAmount * 30;
  }

  return usdAmount;
}

function inferCategory(appName: string): string {
  const name = appName.toLowerCase();

  if (name.includes("email") || name.includes("sms") || name.includes("klaviyo")) {
    return "marketing";
  }

  if (name.includes("review") || name.includes("loyalty") || name.includes("ugc")) {
    return "social-proof";
  }

  if (name.includes("seo") || name.includes("search") || name.includes("schema")) {
    return "seo";
  }

  if (name.includes("upsell") || name.includes("bundle") || name.includes("cross sell")) {
    return "conversion";
  }

  if (name.includes("shipping") || name.includes("fulfill") || name.includes("inventory")) {
    return "operations";
  }

  if (name.includes("analytics") || name.includes("report") || name.includes("heatmap")) {
    return "analytics";
  }

  if (name.includes("subscription") || name.includes("recharge")) {
    return "subscriptions";
  }

  if (name.includes("chat") || name.includes("support") || name.includes("helpdesk")) {
    return "support";
  }

  return "general";
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
