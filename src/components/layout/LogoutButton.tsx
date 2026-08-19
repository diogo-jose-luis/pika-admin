"use client";

import { useState, useTransition, type ComponentPropsWithoutRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import { useLocale } from "@/components/providers/LocaleProvider";
import { FaIcon } from "@/components/ui/FaIcon";
import { cn } from "@/lib/cn";

type LogoutButtonProps = {
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
  labelClassName?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "type" | "onClick" | "children">;

export function LogoutButton({
  className,
  iconClassName = "h-4 w-4",
  showLabel = false,
  labelClassName,
  ...buttonProps
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(() => {
      logout();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 text-pika-muted transition hover:bg-pika-page hover:text-pika-ink",
          className,
        )}
        aria-label={buttonProps["aria-label"] ?? t("logout.label")}
        title={showLabel ? buttonProps.title : (buttonProps.title ?? t("logout.label"))}
        {...buttonProps}
      >
        <FaIcon name="sign-out" className={iconClassName} />
        {showLabel ? (
          <span className={cn("text-sm font-medium text-pika-ink", labelClassName)}>
            {t("logout.label")}
          </span>
        ) : null}
      </button>
      <LogoutConfirmModal
        open={open}
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
