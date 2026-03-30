"use client";

import { ArrowLeft, PackagePlus, PencilLine, ShieldCheck } from "lucide-react";
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
    description: product.description,
    inventoryCount: String(product.inventoryCount),
    isActive: product.isActive,
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
  const [userEmail, setUserEmail] = useState("");

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

        setUserEmail(session.user.email ?? "");

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

      setUserEmail(session.user.email ?? "");
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
    ? "Cập nhật catalog trên một màn hình riêng để thao tác gọn hơn khi dùng điện thoại."
    : "Tạo sản phẩm trên một form riêng, tập trung vào nhập liệu và tránh chật chội trên trang danh sách.";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="grain-overlay absolute inset-0 opacity-35" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="surface-panel relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute inset-y-0 right-0 hidden w-64 bg-gradient-to-l from-clay/12 via-gold/10 to-transparent lg:block" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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

            <div className="rounded-[26px] border border-line bg-white/75 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Tài khoản đang thao tác
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-forest">
                {userEmail}
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)]">
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

            <aside className="surface-panel h-fit p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-forest/10 p-3 text-forest">
                  {isEditing ? (
                    <PencilLine className="h-5 w-5" />
                  ) : (
                    <PackagePlus className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                    Trải nghiệm mobile-first
                  </p>
                  <p className="mt-1 text-sm font-semibold text-forest">
                    Form tách riêng để nhập nhanh và tránh chật chội trên điện thoại.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-line bg-white/65 p-4">
                <div className="flex items-start gap-3">
                  <span className="rounded-full bg-forest/10 p-2 text-forest">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-forest">
                      Dữ liệu đang ghi trực tiếp lên Supabase
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      Mọi thao tác tạo và cập nhật đều đi qua Edge Function `products`
                      rồi đồng bộ về danh mục dùng chung.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-line bg-background/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Gợi ý nhập liệu
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-7 text-foreground">
                  <li>Dùng mã sản phẩm ngắn, dễ tìm bằng ô search.</li>
                  <li>Giá bán tự format theo chuẩn tiền Việt ngay trong lúc nhập.</li>
                  <li>Ô tồn kho để trống khi tạo mới, tránh nhập nhầm số 0 mặc định.</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
