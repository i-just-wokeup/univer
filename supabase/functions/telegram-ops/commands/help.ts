import type { CommandHandler } from "./types.ts";

export function getHelpMessage(): string {
  return [
    "unip 운영봇",
    "",
    "/status - 서비스·DB 상태",
    "/users - 전체·활성 이용자 현황",
    "/today - 오늘 가입자·게시물·스토리",
    "/reports - 처리 대기 신고",
    "/uploads - 처리 중·실패 영상",
    "/help - 명령어 안내",
  ].join("\n");
}

export const helpCommand: CommandHandler = () => getHelpMessage();

export const unknownCommand: CommandHandler = () =>
  `지원하지 않는 명령어입니다.\n\n${getHelpMessage()}`;
