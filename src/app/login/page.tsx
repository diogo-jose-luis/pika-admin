import Image from "next/image";
import { LoginForm } from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <div className="scheme-light flex min-h-svh flex-col bg-white text-neutral-900 lg:flex-row">
      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20">
        <LoginForm />
      </section>

      <section className="relative hidden min-h-svh flex-1 items-center justify-center bg-white p-6 lg:flex lg:p-8">
        <div className="flex h-full w-full items-center justify-center rounded-[2.5rem] bg-[#1a1008]">
          <Image
            src="/logo.png"
            alt="Pika"
            width={420}
            height={140}
            className="h-auto w-full max-w-[min(420px,75%)] object-contain"
            priority
          />
        </div>
      </section>
    </div>
  );
}
