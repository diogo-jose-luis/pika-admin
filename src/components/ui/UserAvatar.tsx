"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const PLACEHOLDER_SRC = "/avatar-placeholder.svg";

type UserAvatarProps = {
  photoUrl?: string | null;
  name: string;
  className?: string;
};

export function UserAvatar({ photoUrl, name, className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoUrl]);

  const src = photoUrl?.trim() && !failed ? photoUrl : PLACEHOLDER_SRC;
  const isPlaceholder = src === PLACEHOLDER_SRC;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-slate-200",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={isPlaceholder ? `${name || "Utilizador"}` : name}
        className="h-full w-full object-cover"
        onError={() => {
          if (!isPlaceholder) setFailed(true);
        }}
      />
    </div>
  );
}
