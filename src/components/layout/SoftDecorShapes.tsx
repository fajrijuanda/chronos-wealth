import { cn } from "@/lib/utils";

type SoftDecorShapesProps = {
  variant?: "dashboard" | "auth";
  className?: string;
};

export function SoftDecorShapes({ variant = "dashboard", className }: SoftDecorShapesProps) {
  const isAuth = variant === "auth";

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div
        className={cn(
          "absolute rounded-full bg-linear-to-br from-[#d7d9ff]/90 to-[#b9c6ff]/85 shadow-[0_28px_70px_-44px_rgba(120,129,216,0.95)] blur-[1px] animate-float-soft",
          isAuth
            ? "-right-6 top-[44%] h-20 w-20 md:-right-8 md:top-[40%] md:h-28 md:w-28"
            : "-right-5 top-[62%] h-16 w-16 md:right-8 md:top-[54%] md:h-28 md:w-28",
        )}
      />

      <div
        className={cn(
          "absolute rotate-12 rounded-[28px] bg-linear-to-br from-[#c5cdfc]/85 to-[#b3c0f8]/80 shadow-[0_24px_60px_-36px_rgba(117,126,206,0.95)] animate-float-soft [animation-delay:0.6s]",
          isAuth
            ? "right-[10%] top-[62%] h-16 w-16 md:right-[16%] md:top-[58%] md:h-24 md:w-24"
            : "right-[4%] top-[70%] h-16 w-16 md:right-[12%] md:top-[62%] md:h-24 md:w-24",
        )}
      />

      <div
        className={cn(
          "absolute rounded-[30%_70%_68%_32%/28%_40%_60%_72%] bg-linear-to-br from-[#dbe1ff]/90 to-[#c0caf6]/90 shadow-[0_24px_56px_-34px_rgba(118,128,210,0.9)] animate-float-soft [animation-delay:0.9s]",
          isAuth
            ? "right-[5%] top-[25%] h-16 w-16 md:right-[8%] md:top-[28%] md:h-20 md:w-20"
            : "right-[1%] top-[36%] h-14 w-14 md:right-[6%] md:top-[30%] md:h-20 md:w-20",
        )}
      />

      <div
        className={cn(
          "absolute h-0 w-0 border-l-24 border-r-24 border-b-40 border-l-transparent border-r-transparent border-b-[#c8c3f1]/60 drop-shadow-[0_14px_18px_rgba(132,140,214,0.25)] animate-float-soft [animation-delay:1.2s] md:border-l-36 md:border-r-36 md:border-b-58",
          isAuth
            ? "right-[18%] top-[74%] rotate-8 md:right-[22%] md:top-[69%]"
            : "right-[12%] top-[82%] rotate-8 md:right-[18%] md:top-[74%]",
        )}
      />
    </div>
  );
}
