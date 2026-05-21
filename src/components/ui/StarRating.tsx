import { FaIcon } from "@/components/ui/FaIcon";
import { cn } from "@/lib/cn";

type StarRatingProps = {
  value: number | null;
  max?: number;
  className?: string;
  iconClassName?: string;
  emptyLabel?: string;
};

/** Estrelas preenchidas/vazias com ícones Font Awesome locais (`star` / `star-o`). */
export function StarRating({
  value,
  max = 5,
  className,
  iconClassName = "h-4 w-4",
  emptyLabel = "—",
}: StarRatingProps) {
  if (value == null || value < 1) {
    return (
      <span className={cn("text-xs font-medium text-pika-muted", className)}>
        {emptyLabel}
      </span>
    );
  }

  const full = Math.min(max, Math.max(1, Math.round(value)));

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${full} de ${max} estrelas`}
    >
      {Array.from({ length: max }, (_, i) => (
        <FaIcon
          key={i}
          name={i < full ? "star" : "star-o"}
          className={cn(
            iconClassName,
            i < full ? "text-amber-400" : "text-pika-muted/45",
          )}
        />
      ))}
    </span>
  );
}
