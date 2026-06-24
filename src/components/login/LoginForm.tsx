"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FaIcon } from "@/components/ui/FaIcon";
import { ForgotPasswordModal } from "@/components/login/ForgotPasswordModal";
import { useAuth } from "@/context/AuthContext";
import { extractApiErrorMessage } from "@/lib/api-error";
import { defaultRouteForNivel } from "@/lib/permissions";

const labelClassName = "mb-2 block text-sm font-semibold text-neutral-900";
const inputClassName =
  "w-full rounded-xl border border-pika-primary bg-[#f0f0f0] py-3 pl-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-pika-primary focus:ring-2 focus:ring-pika-primary/25 disabled:cursor-not-allowed disabled:opacity-60";
const mutedTextClassName = "text-sm font-medium text-neutral-800";

export function LoginForm() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const isPending = pending || authLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      await login(email.trim(), password);
      if (!remember) {
        /* sessão mantida em localStorage; "lembrar" reservado para futura duração */
      }
      const storedUser = localStorage.getItem("user");
      const nivel = storedUser
        ? (JSON.parse(storedUser) as { nivel?: number }).nivel
        : undefined;
      router.replace(
        typeof nivel === "number" ? defaultRouteForNivel(nivel) : "/dashboard",
      );
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Não foi possível iniciar sessão. Tente novamente.",
        ),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-[400px] text-neutral-900">
        <div className="mb-10 flex justify-center lg:hidden">
          <Image
            src="/logo.png"
            alt="Pika"
            width={280}
            height={90}
            className="h-20 w-auto object-contain"
            priority
          />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-black">
          Iniciar sessão
        </h1>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-10 space-y-6">
          <label className="block">
            <span className={labelClassName}>E-mail</span>
            <span className="relative flex">
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                disabled={isPending}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClassName} pr-11`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-pika-primary">
                <FaIcon name="envelope" className="h-4 w-4" />
              </span>
            </span>
          </label>

          <label className="block">
            <span className={labelClassName}>Senha</span>
            <span className="relative flex">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={isPending}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClassName} pr-20`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isPending}
                className="absolute inset-y-0 right-11 flex w-9 items-center justify-center text-pika-primary transition hover:text-pika-primary-dark disabled:opacity-50"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="h-4 w-4"
                />
              </button>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-pika-primary">
                <FaIcon name="lock" className="h-4 w-4" />
              </span>
            </span>
          </label>

          {error ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              <p>{error}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              className={`flex cursor-pointer items-center gap-2.5 ${mutedTextClassName}`}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-neutral-400 text-pika-primary focus:ring-pika-primary/30 disabled:opacity-60"
              />
              Lembre de mim
            </label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-sm font-semibold text-pika-primary-dark transition hover:text-pika-primary"
            >
              Esqueceu sua senha?
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pika-primary py-3.5 text-base font-bold text-white transition hover:bg-pika-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pika-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <FaIcon name="spinner" className="h-4 w-4 animate-spin" />
                A validar…
              </>
            ) : (
              "Iniciar sessão"
            )}
          </button>
        </form>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}
