export type LemonSqueezyConfig = {
  apiKey: string;
  storeId: string;
  variantId: string;
};

export function getLemonSqueezyConfig(): LemonSqueezyConfig | null {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    return null;
  }

  return {
    apiKey,
    storeId,
    variantId
  };
}

export function lemonSqueezyEnabled() {
  return getLemonSqueezyConfig() !== null;
}
