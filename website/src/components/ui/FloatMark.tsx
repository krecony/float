import { withBasePath } from "@/lib/basePath";

interface FloatMarkProps {
  className?: string;
}

export function FloatMark({ className = "" }: FloatMarkProps) {
  return (
    <img
      src={withBasePath("/vercel.svg")}
      alt="Float pool ring icon"
      className={className}
    />
  );
}
