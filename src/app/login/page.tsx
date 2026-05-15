import Image from "next/image";
import { LoginBackground } from "@/components/login/LoginBackground";
import { LoginForm } from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-pika-page">
      <LoginBackground />

      <div className="relative z-10 mx-auto flex min-h-svh max-w-6xl flex-col lg:flex-row">
        <div className="relative flex flex-1 flex-col justify-center px-8 py-12 text-white lg:px-14">
          <div className="absolute inset-0 bg-gradient-to-br from-pika-primary/75 to-pika-primary-dark/55 lg:from-pika-primary/50 lg:to-transparent" />
          <div className="relative mx-auto max-w-md lg:mx-0">
            <div className="inline-flex rounded-2xl bg-pika-card/95 px-5 py-3 shadow-md shadow-black/10">
              <Image
                src="/logo_pika.png"
                alt="Pika"
                width={200}
                height={64}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
            <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight drop-shadow-sm">
              Operações claras. Crescimento no ritmo certo.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/90 drop-shadow-sm">
              Aceda ao painel para acompanhar corridas, equipas e indicadores em tempo
              real, com a mesma identidade visual que os seus motoristas e passageiros
              já reconhecem na rua.
            </p>
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
