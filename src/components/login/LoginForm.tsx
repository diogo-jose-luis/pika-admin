"use client";

import { useActionState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { loginAction } from "@/app/actions/auth";

function Spinner() {
  return (
    <FontAwesomeIcon
      icon={faSpinner}
      className="h-4 w-4 animate-spin"
      aria-hidden
    />
  );
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/25 bg-pika-card/95 p-8 shadow-xl shadow-black/15 backdrop-blur-sm">
        <div className="mb-8 lg:hidden">
          <Image
            src="/logo_pika.png"
            alt="Pika"
            width={160}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
        <div className="mb-6 hidden lg:block">
          <p className="text-sm font-semibold text-pika-primary">Entrar</p>
          <h1 className="mt-1 text-2xl font-bold text-pika-ink">Painel administrativo</h1>
          <p className="mt-2 text-sm text-pika-muted">
            Introduza as suas credenciais para continuar.
          </p>
        </div>
        <div className="mb-6 lg:hidden">
          <h1 className="text-2xl font-bold text-pika-ink">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-pika-muted">
            Inicie sessão para aceder ao painel.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Email
            </span>
            <span className="relative flex">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
                <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
              </span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                disabled={isPending}
                placeholder="nome@empresa.ao"
                className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/30 transition placeholder:text-pika-muted/70 focus:border-pika-primary focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Palavra-passe
            </span>
            <span className="relative flex">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
                <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
              </span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isPending}
                placeholder="••••••••"
                className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/30 transition placeholder:text-pika-muted/70 focus:border-pika-primary focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </span>
          </label>

          {state?.error ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-pika-muted">
              <input
                type="checkbox"
                name="remember"
                disabled={isPending}
                className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary disabled:opacity-60"
              />
              Manter sessão
            </label>
            <button
              type="button"
              className="text-sm font-medium text-pika-primary transition hover:text-pika-primary-dark"
            >
              Esqueceu a palavra-passe?
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pika-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pika-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Spinner />
                A validar…
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-pika-muted">
          Ao continuar, aceita as políticas de segurança e privacidade da Pika.
        </p>
      </div>
    </div>
  );
}
