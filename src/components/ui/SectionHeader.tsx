import { cn } from "@/src/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  description,
  centered = true,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 space-y-4",
        centered ? "text-center" : "text-left",
        className
      )}
    >
      {subtitle && (
        <p className="text-gold font-medium tracking-widest uppercase text-sm">
          {subtitle}
        </p>
      )}
      <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
