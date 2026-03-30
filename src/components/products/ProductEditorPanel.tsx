"use client";

import type {
  ProductFormErrors,
  ProductFormValues,
} from "@/src/domain/product.validation";
import { formatCurrencyInput } from "@/src/domain/product.validation";

type ProductEditorPanelProps = {
  errors: ProductFormErrors;
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (
    field: keyof ProductFormValues,
    value: ProductFormValues[keyof ProductFormValues],
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  values: ProductFormValues;
};

function FieldMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-clay">{message}</p>;
}

export function ProductEditorPanel({
  errors,
  isEditing,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  values,
}: ProductEditorPanelProps) {
  return (
    <aside className="surface-panel h-fit p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
            Editor
          </p>
          <h2 className="display-title mt-3 text-3xl font-semibold text-forest">
            {isEditing ? "Cập nhật sản phẩm" : "Tạo sản phẩm mới"}
          </h2>
        </div>
        {isEditing ? (
          <button
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:border-forest hover:text-forest"
            onClick={onCancel}
            type="button"
          >
            Hủy chỉnh sửa
          </button>
        ) : null}
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-forest"
            htmlFor="product-code"
          >
            Mã sản phẩm
          </label>
          <span className="field-shell block">
            <input
              className="w-full bg-transparent outline-none"
              id="product-code"
              name="productCode"
              onChange={(event) => onChange("productCode", event.target.value)}
              placeholder="SP-001"
              required
              value={values.productCode}
            />
          </span>
          <FieldMessage message={errors.productCode} />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold text-forest"
            htmlFor="product-name"
          >
            Tên sản phẩm
          </label>
          <span className="field-shell block">
            <input
              className="w-full bg-transparent outline-none"
              id="product-name"
              name="productName"
              onChange={(event) => onChange("productName", event.target.value)}
              placeholder="Trà ô long thượng hạng"
              required
              value={values.productName}
            />
          </span>
          <FieldMessage message={errors.productName} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-forest"
              htmlFor="product-price"
            >
              Giá bán (VND)
            </label>
            <span className="field-shell flex items-center gap-3">
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                id="product-price"
                inputMode="numeric"
                name="unitPrice"
                onChange={(event) =>
                  onChange("unitPrice", formatCurrencyInput(event.target.value))
                }
                placeholder="1.000.000"
                required
                value={values.unitPrice}
              />
              <span className="shrink-0 text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                VNĐ
              </span>
            </span>
            <FieldMessage message={errors.unitPrice} />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-forest"
              htmlFor="product-inventory"
            >
              Tồn kho
            </label>
            <span className="field-shell block">
              <input
                className="w-full bg-transparent outline-none"
                id="product-inventory"
                inputMode="numeric"
                name="inventoryCount"
                onChange={(event) =>
                  onChange("inventoryCount", event.target.value)
                }
                placeholder="48"
                required
                value={values.inventoryCount}
              />
            </span>
            <FieldMessage message={errors.inventoryCount} />
          </div>
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold text-forest"
            htmlFor="product-description"
          >
            Mô tả ngắn
          </label>
          <span className="field-shell block">
            <textarea
              className="min-h-28 w-full resize-none bg-transparent outline-none"
              id="product-description"
              name="description"
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Ghi chú nổi bật để đội bán hàng nhận biết nhanh."
              value={values.description}
            />
          </span>
          <FieldMessage message={errors.description} />
        </div>

        <label
          className="flex items-center gap-3 rounded-[22px] border border-line bg-white/55 px-4 py-4"
          htmlFor="product-active"
        >
          <input
            checked={values.isActive}
            className="h-4 w-4 accent-[var(--forest)]"
            id="product-active"
            name="isActive"
            onChange={(event) => onChange("isActive", event.target.checked)}
            type="checkbox"
          />
          <span className="text-sm font-semibold text-forest">
            Đang kinh doanh
          </span>
        </label>

        {errors.form ? (
          <p className="rounded-[20px] border border-clay/20 bg-clay/8 px-4 py-3 text-sm text-clay">
            {errors.form}
          </p>
        ) : null}

        <button
          className="w-full rounded-full bg-forest px-5 py-4 text-sm font-semibold text-paper transition hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? "Đang lưu..."
            : isEditing
              ? "Lưu thay đổi"
              : "Tạo sản phẩm"}
        </button>
      </form>
    </aside>
  );
}
