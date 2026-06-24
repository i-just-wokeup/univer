"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

import {
  getConversations,
  getMessages,
  type ConversationWithUser,
  type Message,
} from "./api";

const MESSAGE_PAGE_SIZE = 50;

type ChatMessage = Message & {
  isOptimistic?: boolean;
};

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

    const timeoutId = window.setTimeout(() => {
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
      window.clearTimeout(timeoutId);
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
      const tempId = `optimistic_${crypto.randomUUID()}`;
      const optimisticMessage: ChatMessage = {
        content,
        conversation_id: conversationId,
        created_at: new Date().toISOString(),
        id: tempId,
        isOptimistic: true,
        message_type: "text",
        read_at: null,
        sender_id: senderId,
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
    const supabase = getSupabaseBrowserClient();

    if (!supabase || error) {
      return;
    }

    const channel = supabase
      .channel(`messages:${conversationId}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `conversation_id=eq.${conversationId}`,
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const nextMessage = payload.new as Message;

          setMessages((prevMessages) => {
            if (prevMessages.some((message) => message.id === nextMessage.id)) {
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
          window.dispatchEvent(new Event("chat:refresh"));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, error]);

  // 대화별 공유 채널에서 상대의 "읽음" 이벤트를 받아 내 메시지를 읽음 처리한다.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

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
    const timeoutId = window.setTimeout(() => {
      void loadInitial();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadInitial]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`conversations:mine:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          void silentReload();
        },
      )
      .subscribe();

    window.addEventListener("chat:refresh", silentReload);

    return () => {
      window.removeEventListener("chat:refresh", silentReload);
      void supabase.removeChannel(channel);
    };
  }, [silentReload]);

  return { active, isLoading, pending, reload: silentReload };
}
