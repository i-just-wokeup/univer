import { useCallback, useEffect, useRef, useState } from "react";

import {
  getPostInsight,
  getPostRetention,
  type PostInsight,
  type PostRetentionPoint,
} from "./api";

export function usePostInsight(postId: string) {
  const requestIdRef = useRef(0);
  const [insight, setInsight] = useState<PostInsight | null>(null);
  const [retention, setRetention] = useState<PostRetentionPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [nextInsight, nextRetention] = await Promise.all([
        getPostInsight(postId),
        getPostRetention(postId),
      ]);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setInsight(nextInsight);
      setRetention(nextInsight?.isVideo ? nextRetention : []);
    } catch {
      if (requestId === requestIdRef.current) {
        setErrorMessage("게시물 인사이트를 불러오지 못했습니다.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [postId]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return {
    errorMessage,
    insight,
    isLoading,
    reload: load,
    retention,
  };
}
