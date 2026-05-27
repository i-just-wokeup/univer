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

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
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

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `conversation_id=eq.${conversationId}`,
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prevMessages) => [
            ...prevMessages,
            payload.new as Message,
          ]);
          window.dispatchEvent(new Event("chat:refresh"));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { hasMore, isLoading, isLoadingMore, loadMore, messages };
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
      .channel("conversations:mine")
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
