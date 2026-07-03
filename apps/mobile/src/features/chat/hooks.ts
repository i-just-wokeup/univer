import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

import { PAGE_SIZE } from "../../lib/constants/pagination";
import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getConversations,
  hydrateMessagesWithSharedPosts,
  getMessages,
  type ConversationWithUser,
  type Message,
} from "./api";

const MESSAGE_PAGE_SIZE = PAGE_SIZE.messages;

type ChatMessage = Message & {
  isOptimistic?: boolean;
};

function createRuntimeId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  // 읽음 표시는 DB 변경 감지 대신 Broadcast(읽었다 이벤트)로 즉시 전달한다.
  const readChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      async function loadMessages() {
        try {
          setIsLoading(true);
          setError(null);
          const nextMessages = await getMessages(conversationId, {
            limit: MESSAGE_PAGE_SIZE,
          });

          if (isMounted) {
            setMessages(nextMessages);
            setHasMore(nextMessages.length === MESSAGE_PAGE_SIZE);
          }
        } catch (loadError) {
          if (isMounted) {
            setMessages([]);
            setHasMore(false);
            setError(
              loadError instanceof Error
                ? loadError.message
                : "메시지를 불러오지 못했습니다.",
            );
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      void loadMessages();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [conversationId]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setError(null);
      const olderMessages = await getMessages(conversationId, {
        before: messages[0].created_at,
        limit: MESSAGE_PAGE_SIZE,
      });

      setMessages((currentMessages) => [...olderMessages, ...currentMessages]);
      setHasMore(olderMessages.length === MESSAGE_PAGE_SIZE);
    } catch (loadMoreError) {
      setError(
        loadMoreError instanceof Error
          ? loadMoreError.message
          : "이전 메시지를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore, messages]);

  const addOptimisticMessage = useCallback(
    (content: string, senderId: string) => {
      const tempId = `optimistic_${createRuntimeId()}`;
      const optimisticMessage: ChatMessage = {
        content,
        conversation_id: conversationId,
        created_at: new Date().toISOString(),
        id: tempId,
        isOptimistic: true,
        message_type: "text",
        read_at: null,
        sender_id: senderId,
        shared_post_id: null,
      };

      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

      return tempId;
    },
    [conversationId],
  );

  const replaceOptimisticMessage = useCallback(
    (tempId: string, realMessage: Message) => {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.id === tempId ? realMessage : message,
        ),
      );
    },
    [],
  );

  const removeOptimisticMessage = useCallback((tempId: string) => {
    setMessages((prevMessages) =>
      prevMessages.filter((message) => message.id !== tempId),
    );
  }, []);

  useEffect(() => {
    if (error) {
      return;
    }

    let isSubscribed = true;
    const supabase = getSupabaseMobileClient();
    const channel = supabase
      .channel(`messages:${conversationId}:${createRuntimeId()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `conversation_id=eq.${conversationId}`,
          schema: "public",
          table: "messages",
        },
        (payload) => {
          void hydrateMessagesWithSharedPosts([payload.new as Message]).then(
            ([nextMessage]) => {
              if (!isSubscribed || !nextMessage) {
                return;
              }

              setMessages((prevMessages) => {
                if (
                  prevMessages.some((message) => message.id === nextMessage.id)
                ) {
                  return prevMessages;
                }

                const optimisticIndex = prevMessages.findIndex(
                  (message) =>
                    message.isOptimistic === true &&
                    message.sender_id === nextMessage.sender_id &&
                    message.content === nextMessage.content,
                );

                if (optimisticIndex === -1) {
                  return [...prevMessages, nextMessage];
                }

                return prevMessages.map((message, index) =>
                  index === optimisticIndex ? nextMessage : message,
                );
              });
            },
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `conversation_id=eq.${conversationId}`,
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // 상대가 읽으면 내 메시지의 read_at이 갱신된다 → "전송됨"을 "읽음"으로 반영.
          const updatedMessage = payload.new as Message;

          setMessages((prevMessages) =>
            prevMessages.map((message) =>
              message.id === updatedMessage.id
                ? { ...message, read_at: updatedMessage.read_at }
                : message,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      void supabase.removeChannel(channel);
    };
  }, [conversationId, error]);

  // 대화별 공유 채널(같은 topic)에서 상대의 "읽음" 이벤트를 받아 내 메시지를 읽음 처리한다.
  useEffect(() => {
    const supabase = getSupabaseMobileClient();
    const channel = supabase
      .channel(`chat:read:${conversationId}`)
      .on("broadcast", { event: "read" }, ({ payload }) => {
        const readerId = (payload as { readerId?: string }).readerId;

        if (!readerId) {
          return;
        }

        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.sender_id !== readerId && !message.read_at
              ? { ...message, read_at: new Date().toISOString() }
              : message,
          ),
        );
      })
      .subscribe();

    readChannelRef.current = channel;

    return () => {
      readChannelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // 내가 읽었음을 같은 대화 채널에 알린다(상대가 보낸 메시지를 읽음으로 바꾸게).
  const broadcastRead = useCallback((readerId: string) => {
    void readChannelRef.current?.send({
      event: "read",
      payload: { readerId },
      type: "broadcast",
    });
  }, []);

  return {
    addOptimisticMessage,
    broadcastRead,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    messages,
    removeOptimisticMessage,
    replaceOptimisticMessage,
  };
}

export function useConversations() {
  const [active, setActive] = useState<ConversationWithUser[]>([]);
  const [pending, setPending] = useState<ConversationWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const silentReload = useCallback(async () => {
    const nextConversations = await getConversations();
    setActive(nextConversations.active);
    setPending(nextConversations.pending);
  }, []);

  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      await silentReload();
    } finally {
      setIsLoading(false);
    }
  }, [silentReload]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadInitial();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadInitial]);

  useEffect(() => {
    const supabase = getSupabaseMobileClient();
    const channel = supabase
      .channel(`conversations:mine:${createRuntimeId()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          void silentReload();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [silentReload]);

  return { active, isLoading, pending, reload: silentReload };
}
