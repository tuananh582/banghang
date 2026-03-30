"use client";

import {
  Boxes,
  LogOut,
  PackageSearch,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from "react";

import {
  formatProductPrice,
  type Product,
} from "@/src/domain/product";
import {
  emptyProductFormValues,
  formatCurrencyInput,
  parseProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from "@/src/domain/product.validation";
import {
  getCurrentSession,
  signOutCurrentUser,
  subscribeToAuthChanges,
} from "@/src/lib/repositories/auth.repository";
import {
  createProduct,
  deleteProduct,
  listProducts,
  sumCatalogValue,
  sumInventory,
  updateProduct,
} from "@/src/lib/repositories/products.repository";
import { ProductEditorPanel } from "@/src/components/products/ProductEditorPanel";
import { ProductsCollection } from "@/src/components/products/ProductsCollection";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra khi làm việc với sản phẩm.";
}

export function ProductsDashboard() {
  const router = useRouter();
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [formValues, setFormValues] = useState<ProductFormValues>(
    emptyProductFormValues,
  );
  const [isBooting, setIsBooting] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isSessionReady, setIsSessionReady] = useState(false);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isEditing = activeProductId !== null;

  async function loadProducts(keyword: string) {
    setIsRefreshing(true);

    try {
      const nextProducts = await listProducts(keyword);
      setProducts(nextProducts);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    async function hydrateSession() {
      try {
        const session = await getCurrentSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        setUserEmail(session.user.email ?? "");
        setIsSessionReady(true);
      } catch {
        router.replace("/login");
      } finally {
        setIsBooting(false);
      }
    }

    void hydrateSession();

    const subscription = subscribeToAuthChanges((_event, session) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      setUserEmail(session.user.email ?? "");
      setIsSessionReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    void loadProducts(deferredSearchQuery);
  }, [deferredSearchQuery, isSessionReady]);

  function resetEditor() {
    setActiveProductId(null);
    setFormErrors({});
    setFormValues(emptyProductFormValues);
  }

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

  function handleEditProduct(product: Product) {
    setActiveProductId(product.id);
    setFormErrors({});
    setFormValues({
      description: product.description,
      inventoryCount: String(product.inventoryCount),
      isActive: product.isActive,
      productCode: product.productCode,
      productName: product.productName,
      unitPrice: formatCurrencyInput(String(product.unitPrice)),
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);

    const parsed = parseProductForm(formValues);
    if (!parsed.data) {
      setFormErrors(parsed.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeProductId) {
        await updateProduct(activeProductId, parsed.data);
        setStatusMessage("Đã cập nhật sản phẩm thành công.");
      } else {
        await createProduct(parsed.data);
        setStatusMessage("Đã tạo sản phẩm thành công.");
      }

      resetEditor();
      await loadProducts(searchQuery);
    } catch (error) {
      setFormErrors({
        form: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Xóa sản phẩm ${product.productCode} khỏi danh mục?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingProductId(product.id);
    setStatusMessage(null);

    try {
      await deleteProduct(product.id);

      if (activeProductId === product.id) {
        resetEditor();
      }

      setStatusMessage("Đã xóa sản phẩm thành công.");
      await loadProducts(searchQuery);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setDeletingProductId(null);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOutCurrentUser();
      router.replace("/login");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isBooting) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-panel px-6 py-5 text-sm text-muted">
          Đang khởi tạo phiên làm việc...
        </div>
      </main>
    );
  }

  const catalogValue = sumCatalogValue(products);
  const inventoryCount = sumInventory(products);
  const activeProductsCount = products.filter((product) => product.isActive).length;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="grain-overlay absolute inset-0 opacity-35" />
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="surface-panel relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute inset-y-0 right-0 hidden w-72 bg-gradient-to-l from-clay/12 via-gold/10 to-transparent lg:block" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">
                Danh mục sản phẩm
              </p>
              <h1 className="display-title mt-3 text-4xl font-semibold text-forest sm:text-5xl">
                Control room cho đội bán hàng
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                Theo dõi giá bán, tồn kho và chỉnh sửa catalog sản phẩm dùng
                chung cho toàn bộ tài khoản đã đăng nhập.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-line bg-white/65 px-4 py-3 text-sm text-muted">
                Đăng nhập bởi{" "}
                <span className="font-semibold text-forest">{userEmail}</span>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-paper transition hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSigningOut}
                onClick={handleSignOut}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Boxes,
              label: "Tổng sản phẩm",
              value: products.length.toString(),
            },
            {
              icon: PackageSearch,
              label: "Đang kinh doanh",
              value: activeProductsCount.toString(),
            },
            {
              icon: Sparkles,
              label: "Giá trị tồn kho",
              value: formatProductPrice(catalogValue),
              note: `${inventoryCount} đơn vị`,
            },
          ].map((item) => (
            <article key={item.label} className="surface-panel p-5">
              <item.icon className="h-5 w-5 text-clay" />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-forest">
                {item.value}
              </p>
              {item.note ? (
                <p className="mt-2 text-sm text-muted">{item.note}</p>
              ) : null}
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <div className="surface-panel p-4 sm:p-5">
              <label className="block">
                <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                  Tìm kiếm nhanh
                </span>
                <span className="field-shell flex items-center gap-3">
                  <Search className="h-4 w-4 text-muted" />
                  <input
                    className="w-full bg-transparent outline-none placeholder:text-muted/65"
                    onChange={(event) => {
                      const value = event.target.value;
                      startTransition(() => {
                        setSearchQuery(value);
                      });
                    }}
                    placeholder="Tìm theo mã hoặc tên"
                    value={searchQuery}
                  />
                </span>
              </label>
            </div>

            {statusMessage ? (
              <div className="rounded-[24px] border border-forest/15 bg-forest/8 px-4 py-4 text-sm text-forest">
                {statusMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-[24px] border border-clay/20 bg-clay/8 px-4 py-4 text-sm text-clay">
                {errorMessage}
              </div>
            ) : null}

            <ProductsCollection
              activeProductId={activeProductId}
              deletingProductId={deletingProductId}
              isRefreshing={isRefreshing}
              onDelete={handleDelete}
              onEdit={handleEditProduct}
              products={products}
              searchQuery={searchQuery}
            />
          </div>

          <ProductEditorPanel
            errors={formErrors}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onCancel={resetEditor}
            onChange={handleFieldChange}
            onSubmit={handleSubmit}
            values={formValues}
          />
        </section>
      </div>
    </main>
  );
}
