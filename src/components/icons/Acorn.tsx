import React from "react";
import { LucideProps } from "lucide-react";

export const Acorn = ({ size = 24, className, ...props }: LucideProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 4v2" />
      <path d="M5.5 8a2.5 2.5 0 0 1 2.5-2.5h8a2.5 2.5 0 0 1 2.5 2.5v1a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-1z" />
      <path d="M6 11c0 4 2 9 6 9s6-5 6-9" />
    </svg>
  );
};
