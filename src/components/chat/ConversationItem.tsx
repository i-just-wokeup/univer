import { Avatar } from "@/components/common/Avatar";
import type { ConversationWithUser } from "@/features/chat/api";
import { getRelativeTimeLabel } from "@/lib/utils/time";

type Props = {
  conversation: ConversationWithUser;
  isActive?: boolean;
  currentUserId: string;
};

export function ConversationItem({ conversation, isActive = false, currentUserId }: Props) {
  const isMine = conversation.last_message_sender_id === currentUserId;
  const preview = conversation.last_message_preview
    ? isMine
      ? `나: ${conversation.last_message_preview}`
      : conversation.last_message_preview
    : "아직 메시지가 없습니다.";
  return (
    <div
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
        isActive ? "bg-zinc-100" : "hover:bg-zinc-50"
      }`}
    >
      <Avatar
        src={conversation.other_user.avatar_url}
        nickname={conversation.other_user.nickname}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium text-zinc-950">
            {conversation.other_user.nickname}
          </p>
          {conversation.status === "pending" ? (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500">
              요청
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-zinc-500">
          {preview}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {conversation.last_message_at ? (
          <span className="text-xs font-medium text-zinc-400">
            {getRelativeTimeLabel(conversation.last_message_at)}
          </span>
        ) : null}
        {conversation.unread_count > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
            {conversation.unread_count}
          </span>
        ) : null}
      </div>
    </div>
  );
}
