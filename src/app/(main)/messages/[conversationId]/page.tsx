"use client";

import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { UserInfo } from "@/components/common/UserInfo";
import { getCurrentUserProfile } from "@/features/auth/api";
import {
  acceptChatRequest,
  markMessagesRead,
  sendMessage,
  type Message,
} from "@/features/chat/api";
import { useConversations, useMessages } from "@/features/chat/hooks";
import { formatChatTime } from "@/lib/utils/time";

type CurrentUserProfile = Pick<
  NonNullable<Awaited<ReturnType<typeof getCurrentUserProfile>>>,
  "id"
>;

function shouldShowSeparator(
  prev: Message | undefined,
  curr: Message,
) {
  if (!prev) {
    return true;
  }

  return (
    new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() >
    5 * 60 * 1000
  );
}

export default function MessageRoomPage() {
  const params = useParams<{ conversationId: string }>();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const { active, pending, reload } = useConversations();
  const {
    addOptimisticMessage,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    messages,
    removeOptimisticMessage,
    replaceOptimisticMessage,
  } = useMessages(params.conversationId);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<CurrentUserProfile | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const conversation = useMemo(
    () =>
      [...active, ...pending].find(
        (item) => item.id === params.conversationId,
      ) ?? null,
    [active, params.conversationId, pending],
  );

  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      getCurrentUserProfile()
        .then((profile) => {
          if (isMounted) {
            setCurrentUserProfile(profile ? { id: profile.id } : null);
          }
        })
        .catch(() => {
          if (isMounted) {
            setCurrentUserProfile(null);
          }
        });
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void markMessagesRead(params.conversationId).catch(() => {});
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [params.conversationId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [isLoading]);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container || previousScrollHeightRef.current === null) {
      return;
    }

    container.scrollTop = container.scrollHeight - previousScrollHeightRef.current;
    previousScrollHeightRef.current = null;
  }, [messages]);

  function handleMessagesScroll() {
    const container = scrollContainerRef.current;

    if (!container || container.scrollTop !== 0 || !hasMore || isLoadingMore) {
      return;
    }

    previousScrollHeightRef.current = container.scrollHeight;
    void loadMore();
  }

  async function handleAcceptRequest() {
    setIsAccepting(true);

    try {
      await acceptChatRequest(params.conversationId);
      await reload();
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleSendMessage(content: string) {
    const tempId = addOptimisticMessage(content, currentUserProfile?.id ?? "");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    try {
      const realMessage = await sendMessage(params.conversationId, content);
      replaceOptimisticMessage(tempId, realMessage);
      await reload();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      removeOptimisticMessage(tempId);
    }
  }

  const lastMineMessageId = [...messages]
    .reverse()
    .find((message) => message.sender_id === currentUserProfile?.id)?.id;
  const isPending = conversation?.status === "pending";
  const isIncomingRequest =
    Boolean(conversation) &&
    isPending &&
    conversation?.initiated_by !== currentUserProfile?.id;

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          {conversation ? (
            <UserInfo
              avatarUrl={conversation.other_user.avatar_url}
              nickname={conversation.other_user.nickname}
              size="md"
            />
          ) : (
            <h1 className="text-base font-bold">메시지</h1>
          )}
        </div>
      </header>

      {isPending ? (
        <section className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            메시지 요청 대기 중입니다. 상대방이 수락하면 대화가 시작됩니다.
          </p>
          {isIncomingRequest ? (
            <button
              type="button"
              disabled={isAccepting}
              onClick={() => {
                void handleAcceptRequest();
              }}
              className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              수락하기
            </button>
          ) : null}
        </section>
      ) : null}

      <main
        ref={scrollContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4"
      >
        {isLoading ? (
          <p className="py-12 text-center text-sm font-medium text-zinc-500">
            메시지를 불러오는 중...
          </p>
        ) : messages.length === 0 ? (
          <p className="py-16 text-center text-sm font-medium text-zinc-500">
            아직 메시지가 없습니다.
          </p>
        ) : (
          <div className="space-y-0.5">
            {isLoadingMore ? (
              <p className="py-2 text-center text-xs text-zinc-400">
                이전 메시지 불러오는 중...
              </p>
            ) : null}
            {!hasMore && messages.length > 0 ? (
              <p className="py-2 text-center text-xs text-zinc-400">
                첫 번째 메시지입니다.
              </p>
            ) : null}
            {messages.map((message, index) => (
              <Fragment key={message.id}>
                {shouldShowSeparator(messages[index - 1], message) ? (
                  <div className="my-4 flex justify-center">
                    <span className="text-xs text-zinc-400">
                      {formatChatTime(message.created_at)}
                    </span>
                  </div>
                ) : null}
                <div className={message.isOptimistic ? "opacity-60" : ""}>
                  <MessageBubble
                    message={message}
                    isMine={message.sender_id === currentUserProfile?.id}
                    showReadReceipt={message.id === lastMineMessageId}
                  />
                </div>
              </Fragment>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <div className="sticky bottom-0 bg-white">
        <MessageInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}
