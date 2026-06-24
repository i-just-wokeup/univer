"use client";

import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { ActionSheet, type ActionSheetItem } from "@/components/common/ActionSheet";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { UserInfo } from "@/components/common/UserInfo";
import { getCurrentUserProfile } from "@/features/auth/api";
import {
  acceptChatRequest,
  markMessagesRead,
  sendMessage,
  type Message,
} from "@/features/chat/api";
import { useConversations, useMessages } from "@/features/chat/hooks";
import { blockUser } from "@/features/blocks/api";
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
  const previousLastMessageIdRef = useRef<string | null>(null);
  const { active, pending, reload } = useConversations();
  const {
    addOptimisticMessage,
    broadcastRead,
    error: messagesError,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

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

  // 방을 열고 있을 때 안 읽은 상대 메시지가 있으면 읽음 처리 + 상대에게 읽음 broadcast.
  useEffect(() => {
    if (!currentUserProfile) {
      return;
    }

    const hasUnreadIncoming = messages.some(
      (message) =>
        message.sender_id !== currentUserProfile.id && !message.read_at,
    );

    if (hasUnreadIncoming) {
      void markMessagesRead(params.conversationId).catch(() => {});
      broadcastRead(currentUserProfile.id);
    }
  }, [broadcastRead, currentUserProfile, messages, params.conversationId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [isLoading]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const lastMessageId = messages.at(-1)?.id ?? null;

    if (!container) {
      return;
    }

    if (previousScrollHeightRef.current !== null) {
      container.scrollTop = container.scrollHeight - previousScrollHeightRef.current;
      previousScrollHeightRef.current = null;
      previousLastMessageIdRef.current = lastMessageId;
      return;
    }

    if (previousLastMessageIdRef.current !== lastMessageId) {
      previousLastMessageIdRef.current = lastMessageId;
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      });
    } else {
      previousLastMessageIdRef.current = lastMessageId;
    }
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

  async function handleBlockUser() {
    if (!conversation || isBlocking) {
      return;
    }

    try {
      setIsBlocking(true);
      await blockUser(conversation.other_user.id);
      router.push("/messages");
    } catch {
      setIsBlocking(false);
      setIsBlockConfirmOpen(false);
    }
  }

  async function handleSendMessage(content: string) {
    const tempId = addOptimisticMessage(content, currentUserProfile?.id ?? "");

    try {
      const realMessage = await sendMessage(params.conversationId, content);
      replaceOptimisticMessage(tempId, realMessage);
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
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-krew-line bg-background/95">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 text-foreground shadow-sm transition hover:text-krew-accent"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between">
            {conversation ? (
              <UserInfo
                avatarUrl={conversation.other_user.avatar_url}
                nickname={conversation.other_user.nickname}
                size="md"
              />
            ) : (
              <h1 className="text-base font-extrabold">메시지</h1>
            )}
            {conversation ? (
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 text-krew-muted shadow-sm transition hover:text-krew-accent"
                aria-label="더보기"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <circle cx="5" cy="12" r="1.75" />
                  <circle cx="12" cy="12" r="1.75" />
                  <circle cx="19" cy="12" r="1.75" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {isPending ? (
        <section className="border-b border-krew-accent-ring bg-krew-accent-soft px-4 py-3">
          <p className="text-sm font-semibold text-krew-accent">
            메시지 요청 대기 중입니다. 상대방이 수락하면 대화가 시작됩니다.
          </p>
          {isIncomingRequest ? (
            <button
              type="button"
              disabled={isAccepting}
              onClick={() => {
                void handleAcceptRequest();
              }}
              className="mt-3 rounded-xl bg-krew-accent px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
            >
              수락하기
            </button>
          ) : null}
        </section>
      ) : null}

      <main
        ref={scrollContainerRef}
        onScroll={handleMessagesScroll}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4"
      >
        {isLoading ? (
          <p className="py-12 text-center text-sm font-semibold text-krew-muted">
            메시지를 불러오는 중...
          </p>
        ) : messagesError ? (
          <div className="flex min-h-full items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-semibold text-krew-muted">
                {messagesError}
              </p>
              <button
                type="button"
                onClick={() => router.push("/messages")}
                className="mt-4 rounded-2xl bg-krew-accent px-4 py-2 text-sm font-extrabold text-white"
              >
                메시지 목록으로
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <p className="py-16 text-center text-sm font-semibold text-krew-muted">
            아직 메시지가 없습니다.
          </p>
        ) : (
          <div className="space-y-0.5">
            {isLoadingMore ? (
              <p className="py-2 text-center text-xs font-medium text-krew-faint">
                이전 메시지 불러오는 중...
              </p>
            ) : null}
            {!hasMore && messages.length > 0 ? (
              <p className="py-2 text-center text-xs font-medium text-krew-faint">
                첫 번째 메시지입니다.
              </p>
            ) : null}
            {messages.map((message, index) => (
              <Fragment key={message.id}>
                {shouldShowSeparator(messages[index - 1], message) ? (
                  <div className="my-4 flex justify-center">
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-krew-faint">
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

      <div className="shrink-0 bg-background pb-[env(safe-area-inset-bottom)]">
        <MessageInput onSend={handleSendMessage} disabled={Boolean(messagesError)} />
      </div>

      <ActionSheet
        isOpen={isMenuOpen}
        items={[
          {
            danger: true,
            label: "차단하기",
            onClick: () => {
              setIsMenuOpen(false);
              setIsBlockConfirmOpen(true);
            },
          },
          {
            label: "취소",
            onClick: () => setIsMenuOpen(false),
          },
        ] satisfies ActionSheetItem[]}
        onClose={() => setIsMenuOpen(false)}
      />

      <ConfirmDialog
        isOpen={isBlockConfirmOpen}
        title={`${conversation?.other_user.nickname ?? ""}을(를) 차단할까요?`}
        description="차단하면 서로의 게시물과 채팅이 숨겨집니다."
        confirmLabel={isBlocking ? "차단 중..." : "차단"}
        onCancel={() => setIsBlockConfirmOpen(false)}
        onConfirm={handleBlockUser}
      />
    </div>
  );
}
