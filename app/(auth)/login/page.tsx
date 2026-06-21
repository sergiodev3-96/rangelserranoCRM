"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === "account_disabled"
      ? "Esta cuenta ha sido desactivada. Póngase en contacto con el administrador."
      : null
  );

  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Por favor, rellene todos los campos.");
      return;
    }

    startTransition(async () => {
      const result = await login(email, password);

      if (!result.success) {
        setErrorMessage(result.error || "Credenciales incorrectas.");
      } else {
        router.push("/leads");
        router.refresh();
      }
    });
  };

  return (
    <div className="z-10 text-center max-w-md w-full glass-panel p-8 rounded-xl border border-border-default glow-effect flex flex-col items-center">
      {/* Brand Icon */}
      <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-on-primary-container text-2xl fill">
          directions_car
        </span>
      </div>

      <h1 className="font-headline-lg text-[24px] text-primary tracking-tight leading-tight mb-1">
        Rangel &amp; Serrano CRM
      </h1>
      <p className="font-body-sm text-[13px] text-text-secondary mb-8">
        Inicie sesión para acceder al portal de financiación
      </p>

      {errorMessage && (
        <div className="w-full mb-6 bg-error-container/20 border border-error/20 text-danger rounded-lg p-3 text-left flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] shrink-0 text-danger">
            error
          </span>
          <span className="font-body-sm text-[13px] leading-tight">
            {errorMessage}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
        {/* Email input */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block"
          >
            Correo Electrónico
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
              mail
            </span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@rangelyserrano.com"
              className="w-full bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-lg pl-10 pr-4 py-2.5 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block"
          >
            Contraseña
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
              lock
            </span>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-lg pl-10 pr-4 py-2.5 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-4 bg-primary text-on-primary accent-glow-hover hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-body-sm font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[18px]">
                sync
              </span>
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">
                login
              </span>
              <span>Acceder al CRM</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center min-h-screen bg-bg-base text-text-primary relative p-6">
      {/* Atmospheric glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <Suspense
        fallback={
          <div className="z-10 text-center max-w-md w-full glass-panel p-8 rounded-xl border border-border-default glow-effect flex flex-col items-center justify-center min-h-[400px]">
            <span className="material-symbols-outlined animate-spin text-[36px] text-primary mb-4">
              sync
            </span>
            <p className="font-body-sm text-[13px] text-text-secondary">
              Cargando formulario de acceso...
            </p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
