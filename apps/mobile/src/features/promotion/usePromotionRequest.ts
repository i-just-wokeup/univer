import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getMyPromotionStatus,
  requestPromotion,
  type PromotionRequestState,
} from "./api";

const REAPPLICATION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "프로 계정 신청을 처리하지 못했습니다.";
}

function getCooldownDaysRemaining(
  requestState: PromotionRequestState | null,
): number {
  if (requestState?.status !== "rejected" || !requestState.reviewedAt) {
    return 0;
  }

  const reviewedAtMs = Date.parse(requestState.reviewedAt);
  if (!Number.isFinite(reviewedAtMs)) {
    return 0;
  }

  const remainingMs = reviewedAtMs + REAPPLICATION_COOLDOWN_MS - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / DAY_MS) : 0;
}

export function usePromotionRequest(enabled: boolean) {
  const requestIdRef = useRef(0);
  const [requestState, setRequestState] =
    useState<PromotionRequestState | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      return undefined;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    void getMyPromotionStatus()
      .then((nextState) => {
        if (requestId === requestIdRef.current) {
          setRequestState(nextState);
        }
      })
      .catch((error: unknown) => {
        if (requestId === requestIdRef.current) {
          setErrorMessage(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setHasLoaded(true);
        }
      });

    return () => {
      requestIdRef.current += 1;
    };
  }, [enabled]);

  const submit = useCallback(async () => {
    if (!enabled || isSubmitting) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await requestPromotion();
      if (requestId === requestIdRef.current) {
        setRequestState({ reviewedAt: null, status: "pending" });
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [enabled, isSubmitting]);

  const clearError = useCallback(() => setErrorMessage(""), []);

  const cooldownDaysRemaining = useMemo(
    () => getCooldownDaysRemaining(requestState),
    [requestState],
  );

  return {
    clearError,
    cooldownDaysRemaining,
    errorMessage,
    isLoading: enabled && !hasLoaded,
    isSubmitting,
    requestState,
    submit,
  };
}
