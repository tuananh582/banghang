"use client";

import { getBrowserEnv } from "@/src/config/env";
import { mapProductRow, type Product } from "@/src/domain/product";
import type { ProductInput } from "@/src/domain/product.validation";
import { mapFunctionError } from "@/src/lib/errors/mapSupabaseError";
import { getBrowserSupabaseClient } from "@/src/lib/supabase/browser";
import type { ProductRow } from "@/src/domain/product";

type ProductsFunctionResponse = {
  data: ProductRow[];
  meta?: {
    query?: string;
    total?: number;
  };
};

type ProductMutationResponse = {
  data: ProductRow;
};

type RequestOptions = {
  body?: ProductInput;
  method?: "DELETE" | "GET" | "PATCH" | "POST";
  searchParams?: Record<string, string>;
};

async function invokeProductsFunction<T>({
  body,
  method = "GET",
  searchParams,
}: RequestOptions) {
  const supabase = getBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const env = getBrowserEnv();
  const endpoint = new URL(
    `/functions/v1/${env.productsFunctionName}`,
    env.supabaseUrl,
  );

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) {
      endpoint.searchParams.set(key, value);
    }
  });

  const response = await fetch(endpoint, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      apikey: env.supabasePublishableKey,
    },
    method,
  });

  if (!response.ok) {
    throw new Error(await mapFunctionError(response));
  }

  return (await response.json()) as T;
}

export async function listProducts(searchQuery: string) {
  const response = await invokeProductsFunction<ProductsFunctionResponse>({
    method: "GET",
    searchParams: searchQuery ? { q: searchQuery } : undefined,
  });

  return response.data.map(mapProductRow);
}

export async function createProduct(input: ProductInput) {
  const response = await invokeProductsFunction<ProductMutationResponse>({
    body: input,
    method: "POST",
  });

  return mapProductRow(response.data);
}

export async function updateProduct(id: string, input: ProductInput) {
  const response = await invokeProductsFunction<ProductMutationResponse>({
    body: input,
    method: "PATCH",
    searchParams: { id },
  });

  return mapProductRow(response.data);
}

export async function deleteProduct(id: string) {
  await invokeProductsFunction<{ success: true }>({
    method: "DELETE",
    searchParams: { id },
  });
}

export function sumInventory(products: Product[]) {
  return products.reduce((total, product) => total + product.inventoryCount, 0);
}

export function sumCatalogValue(products: Product[]) {
  return products.reduce(
    (total, product) => total + product.unitPrice * product.inventoryCount,
    0,
  );
}
