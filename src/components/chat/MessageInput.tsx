"use client";

import { useRef, useState, type KeyboardEvent } from "react";

type Props = {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
};

export function MessageInput({ disabled = false, onSend }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }

  async function handleSend() {
    const trimmedContent = content.trim();

    if (!trimmedContent || disabled || isSending) {
      return;
    }

    setIsSending(true);

    try {
      await onSend(trimmedContent);
      setContent("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSend();
  }

  return (
    <form
      className="flex items-end gap-2 border-t border-zinc-200 bg-white px-4 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSend();
      }}
    >
      <textarea
        ref={textareaRef}
        value={content}
        disabled={disabled || isSending}
        rows={1}
        onChange={(event) => {
          setContent(event.target.value);
          resizeTextarea();
        }}
        onKeyDown={handleKeyDown}
        placeholder="메시지 입력"
        className="max-h-24 min-h-11 flex-1 resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-5 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:bg-zinc-50"
      />
      <button
        type="submit"
        disabled={disabled || isSending || !content.trim()}
        className="h-11 rounded-2xl bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
      >
        전송
      </button>
    </form>
  );
}
