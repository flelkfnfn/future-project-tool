"use client";

import { cn } from "@/lib/utils";
import { useMotionPreference } from "@/components/MotionPreferenceProvider";

type MotionAwareSpinnerProps = {
  className?: string;
  label?: string;
};

export default function MotionAwareSpinner({
  className,
  label = "로딩 중",
}: MotionAwareSpinnerProps) {
  const { resolved } = useMotionPreference();
  const disableSpin = resolved === "reduced";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "animate-spin",
        disableSpin && "animate-none",
        className
      )}
    />
  );
}
