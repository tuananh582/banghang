"use client";

import Link from "next/link";
import { PencilLine, Trash2 } from "lucide-react";

import {
  formatProductPrice,
  formatRelativeDate,
  type Product,
} from "@/src/domain/product";

type ProductsCollectionProps = {
  deletingProductId: string | null;
  isRefreshing: boolean;
  onDelete: (product: Product) => void;
  products: Product[];
  searchQuery: string;
};

function ProductActions({
  editHref,
  isDeleting,
  onDelete,
}: {
  editHref: string;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        aria-label="Sửa"
        className="rounded-full border border-line p-2 text-muted transition hover:border-forest hover:text-forest"
        href={editHref}
      >
        <PencilLine className="h-4 w-4" />
      </Link>
      <button
        aria-label="Xóa"
        className="rounded-full border border-line p-2 text-muted transition hover:border-clay hover:text-clay"
        disabled={isDeleting}
        onClick={onDelete}
        type="button"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProductsCollection({
  deletingProductId,
  isRefreshing,
  onDelete,
  products,
  searchQuery,
}: ProductsCollectionProps) {
  if (products.length === 0) {
    return (
      <div className="surface-panel flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
          Chưa có dữ liệu
        </p>
        <h3 className="display-title mt-3 text-3xl font-semibold text-forest">
          Danh mục đang trống
        </h3>
        <p className="mt-3 max-w-md text-sm leading-7 text-muted">
          {searchQuery
            ? "Không tìm thấy sản phẩm theo mã hoặc tên đã nhập."
            : "Tạo sản phẩm đầu tiên để bắt đầu quản lý tồn kho và giá bán."}
        </p>
        {!searchQuery ? (
          <Link
            className="mt-6 inline-flex items-center justify-center rounded-full bg-forest px-5 py-3 text-sm font-semibold text-paper transition hover:bg-forest-soft"
            href="/products/new"
          >
            Thêm sản phẩm đầu tiên
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-[30px] border border-line bg-white/82 shadow-[0_20px_48px_rgba(20,54,47,0.08)] lg:block">
        <table className="min-w-full border-collapse">
          <thead className="bg-forest text-left text-paper">
            <tr className="text-xs uppercase tracking-[0.18em]">
              <th className="px-5 py-4 font-semibold">Mã</th>
              <th className="px-5 py-4 font-semibold">Tên sản phẩm</th>
              <th className="px-5 py-4 font-semibold">Giá bán</th>
              <th className="px-5 py-4 font-semibold">Tồn kho</th>
              <th className="px-5 py-4 font-semibold">Cập nhật</th>
              <th className="px-5 py-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isDeleting = deletingProductId === product.id;

              return (
                <tr key={product.id} className="bg-white transition hover:bg-forest/4">
                  <td className="border-t border-line px-5 py-4 align-top">
                    <div className="font-semibold text-forest">
                      {product.productCode}
                    </div>
                    <p
                      className={`mt-2 status-pill ${
                        product.isActive
                          ? "border-forest/15 bg-forest/8 text-forest"
                          : "border-line bg-background text-muted"
                      }`}
                    >
                      {product.isActive ? "Đang bán" : "Tạm dừng"}
                    </p>
                  </td>
                  <td className="border-t border-line px-5 py-4 align-top">
                    <p className="font-semibold text-foreground">
                      {product.productName}
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                      {product.description || "Chưa có mô tả"}
                    </p>
                  </td>
                  <td className="border-t border-line px-5 py-4 align-top font-semibold text-foreground">
                    {formatProductPrice(product.unitPrice)}
                  </td>
                  <td className="border-t border-line px-5 py-4 align-top text-foreground">
                    {product.inventoryCount}
                  </td>
                  <td className="border-t border-line px-5 py-4 align-top text-sm text-muted">
                    {formatRelativeDate(product.updatedAt)}
                  </td>
                  <td className="border-t border-line px-5 py-4 align-top">
                    <ProductActions
                      editHref={`/products/${product.id}/edit`}
                      isDeleting={isDeleting}
                      onDelete={() => onDelete(product)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {products.map((product) => {
          const isDeleting = deletingProductId === product.id;

          return (
            <article key={product.id} className="surface-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
                    {product.productCode}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-forest">
                    {product.productName}
                  </h3>
                </div>
                <ProductActions
                  editHref={`/products/${product.id}/edit`}
                  isDeleting={isDeleting}
                  onDelete={() => onDelete(product)}
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">
                {product.description || "Chưa có mô tả"}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 rounded-[24px] bg-background/70 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Giá bán
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {formatProductPrice(product.unitPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Tồn kho
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {product.inventoryCount}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">
                Cập nhật {formatRelativeDate(product.updatedAt)}
              </p>
            </article>
          );
        })}
      </div>

      {isRefreshing ? (
        <p className="text-sm text-muted">Đang đồng bộ dữ liệu sản phẩm...</p>
      ) : null}
    </div>
  );
}
