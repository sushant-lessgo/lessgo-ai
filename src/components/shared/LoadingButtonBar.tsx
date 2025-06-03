import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProgressButton({
  label = "Conducting market research...",
  duration = 2000,
  colorClass = "bg-brand-accentPrimary",
}: {
  label?: string;
  duration?: number;
  colorClass?: string;
}) {
  return (
    <div className="relative w-full max-w-md">
      <Button
        disabled
        variant="outline"
        className="w-full h-11 justify-center relative font-medium text-sm text-gray-800 bg-white border border-gray-300"
      >
        <div
          className={cn("absolute inset-0 h-full", colorClass, "animate-loading-fill rounded-md")}
          style={{
            animationDuration: `${duration}ms`,
            zIndex: 0,
          }}
        />
        <span className="relative z-10">{label}</span>
      </Button>
    </div>
  );
}
