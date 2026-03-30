process.loadEnvFile?.(".env");

import { createConfirmedTestAccount } from "./test-account.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const functionName = process.env.NEXT_PUBLIC_PRODUCTS_FUNCTION_NAME ?? "products";

if (!supabaseUrl || !publishableKey) {
  throw new Error("Thiếu biến môi trường Supabase để test.");
}

async function callProductsFunction(session, method, searchParams, body) {
  const url = new URL(`/functions/v1/${functionName}`, supabaseUrl);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      apikey: publishableKey,
    },
    method,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Edge Function failed with ${response.status}`,
    );
  }

  return payload;
}

const account = await createConfirmedTestAccount();
const uniqueCode = `SP-${Date.now()}`;

console.log(`Using test account: ${account.email}`);

const created = await callProductsFunction(account.session, "POST", undefined, {
  description: "Sản phẩm được tạo bởi smoke test Supabase.",
  inventoryCount: 8,
  isActive: true,
  productCode: uniqueCode,
  productName: "Gói quà thử nghiệm",
  unitPrice: 125000,
});

if (created.data.product_code !== uniqueCode) {
  throw new Error("Tạo sản phẩm thất bại.");
}

const listed = await callProductsFunction(account.session, "GET", {
  q: uniqueCode,
});

if (!listed.data.some((product) => product.product_code === uniqueCode)) {
  throw new Error("Không tìm thấy sản phẩm vừa tạo trong danh sách.");
}

const updated = await callProductsFunction(
  account.session,
  "PATCH",
  { id: created.data.id },
  {
    description: "Đã cập nhật từ smoke test.",
    inventoryCount: 5,
    isActive: false,
    productCode: uniqueCode,
    productName: "Gói quà smoke test",
    unitPrice: 99000,
  },
);

if (
  updated.data.product_name !== "Gói quà smoke test" ||
  updated.data.inventory_count !== 5
) {
  throw new Error("Cập nhật sản phẩm thất bại.");
}

await callProductsFunction(account.session, "DELETE", {
  id: created.data.id,
});

const afterDelete = await callProductsFunction(account.session, "GET", {
  q: uniqueCode,
});

if (afterDelete.data.length !== 0) {
  throw new Error("Sản phẩm vẫn còn tồn tại sau khi xóa.");
}

console.log("Supabase auth + CRUD smoke test passed.");
