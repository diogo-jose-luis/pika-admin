"use client";

import { useState } from "react";

const CANDIDATES = [
  "/background_login.png",
  "/background_login.jpg",
  "/background_login.jpeg",
  "/background_login.webp",
] as const;

export function LoginBackground() {
  const [i, setI] = useState(0);

  return (
    <div className="pointer-events-none absolute inset-0">
      {i < CANDIDATES.length ? (
        // eslint-disable-next-line @next/next/no-img-element -- tenta várias extensões em `public/`
        <img
          src={CANDIDATES[i]}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setI((x) => x + 1)}
        />
      ) : null}
      <div
        className="absolute inset-0 bg-gradient-to-br from-pika-primary/55 via-pika-primary-dark/35 to-pika-primary/50"
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/25" aria-hidden />
    </div>
  );
}
