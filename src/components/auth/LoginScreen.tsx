"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getCurrentSession,
  signInWithPassword,
} from "@/src/lib/repositories/auth.repository";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Không thể đăng nhập. Vui lòng thử lại.";
}

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        const session = await getCurrentSession();

        if (session) {
          router.replace("/products");
          return;
        }
      } catch {
        // Ignore boot errors here and let user continue with manual login.
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signInWithPassword(email, password);
      router.replace("/products");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="grain-overlay absolute inset-0 opacity-35" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-5 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-br from-clay/18 via-gold/12 to-transparent" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="status-pill border-forest/15 bg-forest/8 text-forest">
                  Inventory Studio
                </p>
                <h1 className="display-title mt-5 max-w-xl text-4xl font-semibold leading-tight text-forest sm:text-5xl">
                  Không gian điều phối sản phẩm dành cho đội bán hàng gọn,
                  đẹp, rõ.
                </h1>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Đăng nhập bền vững",
                  value: "Supabase Auth",
                },
                {
                  label: "Quản lý trạng thái",
                  value: "Create / update / search",
                },
                {
                  label: "Thiết kế",
                  value: "Responsive cho mobile",
                },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-[24px] border border-white/70 bg-white/65 p-4 shadow-[0_14px_36px_rgba(20,54,47,0.08)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-forest">
                    {item.value}
                  </p>
                </article>
              ))}
            </div>

            <div className="rounded-[26px] border border-forest/10 bg-forest px-5 py-5 text-paper shadow-[0_18px_48px_rgba(20,54,47,0.22)]">
              <div className="flex items-start gap-4">
                <span className="rounded-full bg-white/12 p-3">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-paper/70">
                    Phiên bản kết nối thật
                  </p>
                  <p className="mt-2 text-sm leading-7 text-paper/88">
                    Form đăng nhập này dùng Supabase Auth email/password và giữ
                    session trên trình duyệt lâu dài bằng cơ chế lưu session và
                    auto refresh token của Supabase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-panel flex items-center p-6 sm:p-8">
          <div className="mx-auto w-full max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">
              BanHang Control Room
            </p>
            <h2 className="display-title mt-4 text-4xl font-semibold text-forest">
              Đăng nhập
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Dùng tài khoản Supabase để truy cập danh mục sản phẩm dùng chung
              và thao tác CRUD qua Edge Function.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-forest">
                  Email công việc
                </span>
                <span className="field-shell block">
                  <input
                    autoComplete="email"
                    className="w-full bg-transparent text-base outline-none placeholder:text-muted/60"
                    disabled={isCheckingSession || isSubmitting}
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nguyen.van.a@company.com"
                    required
                    type="email"
                    value={email}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-forest">
                  Mật khẩu
                </span>
                <span className="field-shell block">
                  <input
                    autoComplete="current-password"
                    className="w-full bg-transparent text-base outline-none placeholder:text-muted/60"
                    disabled={isCheckingSession || isSubmitting}
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    type="password"
                    value={password}
                  />
                </span>
              </label>

              {errorMessage ? (
                <p className="rounded-[20px] border border-clay/20 bg-clay/8 px-4 py-3 text-sm text-clay">
                  {errorMessage}
                </p>
              ) : null}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-4 text-sm font-semibold text-paper transition hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCheckingSession || isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Đang xác thực..." : "Vào bảng điều khiển"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
