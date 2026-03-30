import type { Tables } from "@/src/types/database";

export type ProductRow = Tables<"products">;

export type Product = {
  createdAt: string;
  description: string;
  id: string;
  inventoryCount: number;
  isActive: boolean;
  productCode: string;
  productName: string;
  unitPrice: number;
  updatedAt: string;
};

export function mapProductRow(row: ProductRow): Product {
  return {
    createdAt: row.created_at,
    description: row.description ?? "",
    id: row.id,
    inventoryCount: row.inventory_count,
    isActive: row.is_active,
    productCode: row.product_code,
    productName: row.product_name,
    unitPrice: Number(row.unit_price),
    updatedAt: row.updated_at,
  };
}

export function formatProductPrice(value: number) {
  const normalizedValue = Number.isFinite(value) ? Math.round(value) : 0;

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(normalizedValue)} VNĐ`;
}

export function formatRelativeDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
