"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

const baseStyles =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[#6B5E4A] text-white hover:bg-[#5A4E3D]",
  secondary:
    "border border-[#E2DED3] bg-white text-[#2B2B2B] hover:bg-[#F6F4EF]",
};

export default function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}

