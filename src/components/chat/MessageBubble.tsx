import type { Message } from "@/features/chat/api";
import { formatChatTime } from "@/lib/utils/time";

type Props = {
  message: Message;
  isMine: boolean;
  showReadReceipt?: boolean;
};

export function MessageBubble({
  isMine,
  message,
  showReadReceipt = false,
}: Props) {
  return (
    <div
      className={`group flex w-full items-center gap-2 ${
        isMine ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex max-w-[78%] flex-shrink-0 flex-col ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-2 text-sm leading-6 ${
            isMine
              ? "rounded-tr-sm bg-blue-500 text-white"
              : "rounded-tl-sm bg-zinc-100 text-zinc-900"
          }`}
        >
          {message.content}
        </div>
      </div>
      <span
        className={`min-w-0 flex-1 truncate whitespace-nowrap text-xs text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 ${
          isMine ? "text-right" : "text-left"
        }`}
      >
        {isMine && showReadReceipt
          ? `${message.read_at ? "읽음" : "전송됨"} · `
          : ""}
        {formatChatTime(message.created_at)}
      </span>
    </div>
  );
}
