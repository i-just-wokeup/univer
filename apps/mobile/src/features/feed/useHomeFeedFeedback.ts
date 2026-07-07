import { useCallback, useEffect, useRef, useState } from "react";

export type HomeFeedbackType = "error" | "success";

export type HomeFeedbackState = {
  message: string;
  type: HomeFeedbackType;
} | null;

export function useHomeFeedFeedback() {
  const [feedback, setFeedback] = useState<HomeFeedbackState>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback(
    (message: string, type: HomeFeedbackType) => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }

      setFeedback({ message, type });
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
        feedbackTimerRef.current = null;
      }, 1800);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  return {
    feedback,
    showFeedback,
  };
}
