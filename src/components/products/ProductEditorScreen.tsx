"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import type { Product } from "@/src/domain/product";
import {
  emptyProductFormValues,
  formatCurrencyInput,
  parseProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from "@/src/domain/product.validation";
import {
  getCurrentSession,
  subscribeToAuthChanges,
} from "@/src/lib/repositories/auth.repository";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "@/src/lib/repositories/products.repository";
import { ProductEditorPanel } from "@/src/components/products/ProductEditorPanel";

type ProductEditorScreenProps = {
  mode: "create" | "edit";
  productId?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra khi làm việc với sản phẩm.";
}

function mapProductToFormValues(product: Product): ProductFormValues {
  return {
    productCode: product.productCode,
    productName: product.productName,
    unitPrice: formatCurrencyInput(String(product.unitPrice)),
  };
}

export function ProductEditorScreen({
  mode,
  productId,
}: ProductEditorScreenProps) {
  const router = useRouter();
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [formValues, setFormValues] = useState<ProductFormValues>(
    emptyProductFormValues,
  );
  const [isBooting, setIsBooting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isEditing = mode === "edit";

  useEffect(() => {
    let isMounted = true;

    async function hydrateEditor() {
      try {
        const session = await getCurrentSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        if (!isMounted) {
          return;
        }

        if (isEditing) {
          if (!productId) {
            setLoadError("Thiếu sản phẩm cần chỉnh sửa.");
            return;
          }

          const product = await getProductById(productId);

          if (!isMounted) {
            return;
          }

          if (!product) {
            setLoadError("Không tìm thấy sản phẩm cần chỉnh sửa.");
            return;
          }

          setFormValues(mapProductToFormValues(product));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsBooting(false);
        }
      }
    }

    void hydrateEditor();

    const subscription = subscribeToAuthChanges((_event, session) => {
      if (!session) {
        router.replace("/login");
        return;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isEditing, productId, router]);

  function handleFieldChange(
    field: keyof ProductFormValues,
    value: ProductFormValues[keyof ProductFormValues],
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
    setFormErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseProductForm(formValues);
    if (!parsed.data) {
      setFormErrors(parsed.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        if (!productId) {
          throw new Error("Thiếu sản phẩm cần chỉnh sửa.");
        }

        await updateProduct(productId, parsed.data);
      } else {
        await createProduct(parsed.data);
      }

      startTransition(() => {
        router.replace(
          `/products?status=${isEditing ? "updated" : "created"}`,
        );
      });
    } catch (error) {
      setFormErrors({
        form: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isBooting) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-panel px-6 py-5 text-sm text-muted">
          Đang tải biểu mẫu sản phẩm...
        </div>
      </main>
    );
  }

  const title = isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới";
  const description = isEditing
    ? "Màn hình chỉnh sửa hiện chỉ tập trung vào mã, tên và giá bán để thao tác nhanh hơn."
    : "Màn hình tạo mới chỉ giữ 3 trường cốt lõi: mã sản phẩm, tên sản phẩm và giá bán.";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="grain-overlay absolute inset-0 opacity-35" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="surface-panel relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute inset-y-0 right-0 hidden w-64 bg-gradient-to-l from-clay/12 via-gold/10 to-transparent lg:block" />
          <div className="relative">
            <div>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest"
                href="/products"
              >
                <ArrowLeft className="h-4 w-4" />
                Danh sách sản phẩm
              </Link>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-clay">
                {isEditing ? "Cập nhật catalog" : "Tạo mới catalog"}
              </p>
              <h1 className="display-title mt-3 text-4xl font-semibold text-forest sm:text-5xl">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                {description}
              </p>
            </div>
          </div>
        </header>

        {loadError ? (
          <section className="surface-panel px-5 py-8 text-center sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
              Không thể mở biểu mẫu
            </p>
            <p className="mt-3 text-base text-foreground">{loadError}</p>
            <Link
              className="mt-6 inline-flex items-center justify-center rounded-full bg-forest px-5 py-3 text-sm font-semibold text-paper transition hover:bg-forest-soft"
              href="/products"
            >
              Quay lại danh sách
            </Link>
          </section>
        ) : (
          <div className="mx-auto max-w-3xl">
            <ProductEditorPanel
              cancelLabel="Quay lại danh sách"
              errors={formErrors}
              isEditing={isEditing}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/products")}
              onChange={handleFieldChange}
              onSubmit={handleSubmit}
              values={formValues}
            />
          </div>
        )}
      </div>
    </main>
  );
}
