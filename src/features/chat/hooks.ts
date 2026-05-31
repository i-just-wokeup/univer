"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      async function loadMessages() {
        try {
          setIsLoading(true);
          const nextMessages = await getMessages(conversationId, {
            limit: MESSAGE_PAGE_SIZE,
          });

          if (isMounted) {
            setMessages(nextMessages);
            setHasMore(nextMessages.length === MESSAGE_PAGE_SIZE);
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
      const olderMessages = await getMessages(conversationId, {
        before: messages[0].created_at,
        limit: MESSAGE_PAGE_SIZE,
      });

      setMessages((currentMessages) => [...olderMessages, ...currentMessages]);
      setHasMore(olderMessages.length === MESSAGE_PAGE_SIZE);
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

    if (!supabase) {
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
  }, [conversationId]);

  return {
    addOptimisticMessage,
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
