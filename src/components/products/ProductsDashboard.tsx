"use client";

import {
  LogOut,
  PackagePlus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";

import type { Product } from "@/src/domain/product";
import {
  getCurrentSession,
  signOutCurrentUser,
  subscribeToAuthChanges,
} from "@/src/lib/repositories/auth.repository";
import {
  deleteProduct,
  listProducts,
} from "@/src/lib/repositories/products.repository";
import { ProductsCollection } from "@/src/components/products/ProductsCollection";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra khi làm việc với sản phẩm.";
}

function getStatusMessage(status: string | null) {
  switch (status) {
    case "created":
      return "Đã tạo sản phẩm thành công.";
    case "updated":
      return "Đã cập nhật sản phẩm thành công.";
    default:
      return null;
  }
}

export function ProductsDashboard({
  initialStatus,
}: {
  initialStatus?: string | null;
}) {
  const router = useRouter();
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  const deferredSearchQuery = useDeferredValue(searchQuery);

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

  useEffect(() => {
    const nextStatusMessage = getStatusMessage(initialStatus ?? null);
    if (nextStatusMessage) {
      setStatusMessage(nextStatusMessage);
      setErrorMessage(null);
    }
  }, [initialStatus]);

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
                Quản lý danh mục gọn hơn với đúng 3 dữ liệu cốt lõi: mã sản phẩm,
                tên sản phẩm và giá bán.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-line bg-white/65 px-4 py-3 text-sm text-muted">
                Đăng nhập bởi{" "}
                <span className="font-semibold text-forest">{userEmail}</span>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-paper transition hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-60"
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

        <section className="surface-panel px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
                Tìm kiếm nhanh
              </p>
              <h2 className="display-title mt-3 text-3xl font-semibold text-forest">
                Tra cứu theo mã hoặc tên sản phẩm
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Danh sách và form đều đã được giản lược theo đúng 3 trường chính.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 lg:max-w-xl">
              <label className="field-shell flex w-full items-center gap-3">
                <Search className="h-4 w-4 text-muted" />
                <input
                  className="w-full bg-transparent outline-none placeholder:text-muted/60"
                  enterKeyHint="search"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm theo mã hoặc tên sản phẩm"
                  value={searchQuery}
                />
              </label>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold px-5 py-4 text-sm font-semibold text-foreground shadow-[0_18px_36px_rgba(184,137,61,0.24)] transition hover:bg-[#c99849]"
                href="/products/new"
              >
                <PackagePlus className="h-4 w-4" />
                Thêm sản phẩm
              </Link>
            </div>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-[20px] border border-clay/20 bg-clay/8 px-4 py-3 text-sm text-clay">
              {errorMessage}
            </p>
          ) : null}

          {statusMessage ? (
            <p className="mt-4 rounded-[20px] border border-forest/15 bg-forest/8 px-4 py-3 text-sm text-forest">
              {statusMessage}
            </p>
          ) : null}
        </section>

        <ProductsCollection
          deletingProductId={deletingProductId}
          isRefreshing={isRefreshing}
          onDelete={handleDelete}
          products={products}
          searchQuery={searchQuery}
        />
      </div>
    </main>
  );
}
