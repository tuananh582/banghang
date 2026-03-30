import { z } from "zod";

export type ProductFormValues = {
  productCode: string;
  productName: string;
  unitPrice: string;
};

export type ProductInput = {
  productCode: string;
  productName: string;
  unitPrice: number;
};

export type ProductFormErrors = Partial<
  Record<keyof ProductFormValues, string>
> & {
  form?: string;
};

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCurrencyInput(value: string) {
  const digits = normalizeDigits(value);

  if (!digits) {
    return "";
  }

  const amount = Number(digits);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseCurrencyInput(value: string) {
  const digits = normalizeDigits(value);

  if (!digits) {
    return Number.NaN;
  }

  return Number(digits);
}

const productFormSchema = z.object({
  productCode: z
    .string()
    .trim()
    .min(1, "Nhập mã sản phẩm.")
    .max(40, "Mã sản phẩm tối đa 40 ký tự."),
  productName: z
    .string()
    .trim()
    .min(1, "Nhập tên sản phẩm.")
    .max(120, "Tên sản phẩm tối đa 120 ký tự."),
  unitPrice: z
    .string()
    .trim()
    .min(1, "Nhập giá sản phẩm.")
    .refine((value) => !Number.isNaN(parseCurrencyInput(value)), {
      message: "Giá sản phẩm phải là số.",
    })
    .transform(parseCurrencyInput)
    .refine((value) => value >= 0, {
      message: "Giá sản phẩm không được âm.",
    }),
});

export const emptyProductFormValues: ProductFormValues = {
  productCode: "",
  productName: "",
  unitPrice: "",
};

export function parseProductForm(
  values: ProductFormValues,
):
  | { data: ProductInput; errors: null }
  | { data: null; errors: ProductFormErrors } {
  const parsed = productFormSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      data: null,
      errors: {
        productCode: fieldErrors.productCode?.[0],
        productName: fieldErrors.productName?.[0],
        unitPrice: fieldErrors.unitPrice?.[0],
      },
    };
  }

  return {
    data: parsed.data,
    errors: null,
  };
}
