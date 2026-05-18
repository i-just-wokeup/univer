type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

type AvatarProps = {
  src: string | null | undefined;
  nickname: string;
  size?: AvatarSize;
  className?: string;
};

const sizeClassName: Record<AvatarSize, string> = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
};

function cx(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function Avatar({
  src,
  nickname,
  size = "md",
  className,
}: AvatarProps) {
  const imageUrl = src?.trim();
  const baseClassName = cx(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
    sizeClassName[size],
    className,
  );

  if (imageUrl) {
    return (
      <span className={baseClassName}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${nickname} profile image`}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={cx(baseClassName, "bg-zinc-200 text-zinc-400")}
      role="img"
      aria-label={`${nickname} profile fallback`}
    >
      <svg
        viewBox="0 0 80 80"
        className="h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="40" cy="40" r="40" fill="currentColor" opacity="0.18" />
        <circle cx="40" cy="31" r="13" fill="currentColor" />
        <ellipse cx="40" cy="65" rx="25" ry="21" fill="currentColor" />
      </svg>
    </span>
  );
}
