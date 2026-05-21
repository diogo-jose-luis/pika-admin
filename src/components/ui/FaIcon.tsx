import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type FaIconProps = {
  /** Nome do ficheiro em `public/font-awesome` (sem `.svg`). */
  name: string;
  /** Ícone menor centrado por cima (ex.: check no escudo). */
  overlay?: string;
  className?: string;
  overlayClassName?: string;
  title?: string;
};

function maskStyle(src: string): CSSProperties {
  return {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };
}

/** Ícone Font Awesome 4 (SVG local em `/font-awesome/`). */
export function FaIcon({
  name,
  overlay,
  className,
  overlayClassName,
  title,
}: FaIconProps) {
  const src = `/font-awesome/${name}.svg`;

  if (!overlay) {
    return (
      <span
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        className={cn("inline-block shrink-0 bg-current", className)}
        style={maskStyle(src)}
      />
    );
  }

  const overlaySrc = `/font-awesome/${overlay}.svg`;

  return (
    <span
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("relative inline-block shrink-0", className)}
    >
      <span className="block h-full w-full bg-current" style={maskStyle(src)} />
      <span
        className={cn(
          "absolute inset-[22%] bg-current",
          overlayClassName,
        )}
        style={maskStyle(overlaySrc)}
      />
    </span>
  );
}
