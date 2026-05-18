import Link from "next/link";

import { Avatar } from "@/components/common/Avatar";

type UserInfoProps = {
  avatarUrl: string | null;
  nickname: string;
  size?: "sm" | "md";
};

const textClassName: Record<NonNullable<UserInfoProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
};

export function UserInfo({
  avatarUrl,
  nickname,
  size = "sm",
}: UserInfoProps) {
  return (
    <Link
      href={`/profile/${encodeURIComponent(nickname)}`}
      className={`flex min-w-0 items-center gap-3 font-semibold text-zinc-950 transition hover:text-zinc-700 ${textClassName[size]}`}
    >
      <Avatar src={avatarUrl} nickname={nickname} size={size} />
      <span className="truncate">{nickname}</span>
    </Link>
  );
}
