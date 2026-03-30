"use client";

import { ArrowRight } from "lucide-react";
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
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg items-center">
        <section className="surface-panel w-full p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">
            BanHang Control Room
          </p>
          <h1 className="display-title mt-4 text-4xl font-semibold text-forest sm:text-5xl">
            Đăng nhập
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            Truy cập danh mục sản phẩm dùng chung bằng tài khoản Supabase và
            giữ phiên làm việc dài hạn trên trình duyệt.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="rounded-[24px] border border-line bg-white/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Xác thực
              </p>
              <p className="mt-2 text-base font-semibold text-forest">
                Supabase Auth
              </p>
            </article>
            <article className="rounded-[24px] border border-line bg-white/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Giao diện
              </p>
              <p className="mt-2 text-base font-semibold text-forest">
                Responsive cho mobile
              </p>
            </article>
          </div>

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
        </section>
      </div>
    </main>
  );
}
