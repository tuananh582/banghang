export type BrowserEnv = {
  productsFunctionName: string;
  supabasePublishableKey: string;
  supabaseUrl: string;
};

let cachedBrowserEnv: BrowserEnv | null = null;

export function getBrowserEnv(): BrowserEnv {
  if (cachedBrowserEnv) {
    return cachedBrowserEnv;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const productsFunctionName =
    process.env.NEXT_PUBLIC_PRODUCTS_FUNCTION_NAME ?? "products";

  if (!supabaseUrl) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  cachedBrowserEnv = {
    productsFunctionName,
    supabasePublishableKey,
    supabaseUrl,
  };

  return cachedBrowserEnv;
}
