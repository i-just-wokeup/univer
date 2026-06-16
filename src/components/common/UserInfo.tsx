"use client";

import type { PropsWithChildren } from "react";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/common/Avatar";

type UserInfoProps = {
  avatarUrl: string | null;
  nickname: string;
  size?: "sm" | "md";
};

type ProfileNicknameLinkProps = {
  className?: string;
  nickname: string;
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
    <ProfileNicknameLink
      className={`flex min-w-0 items-center gap-2 ${textClassName[size]}`}
      nickname={nickname}
    >
      <Avatar src={avatarUrl} nickname={nickname} size={size} />
      <span className="truncate">{nickname}</span>
    </ProfileNicknameLink>
  );
}

export function ProfileNicknameLink({
  children,
  className,
  nickname,
}: PropsWithChildren<ProfileNicknameLinkProps>) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        router.push(`/profile/${encodeURIComponent(nickname)}`);
      }}
      className={`font-semibold text-foreground transition hover:text-krew-accent ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
