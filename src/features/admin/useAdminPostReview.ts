"use client";

import { useCallback, useRef, useState } from "react";

import {
  getAdminPostComments,
  getAdminPostInsight,
  type AdminApplicantPost,
  type AdminPostComment,
  type AdminPostInsight,
} from "./api";

export function useAdminPostReview() {
  const requestIdRef = useRef(0);
  const [post, setPost] = useState<AdminApplicantPost | null>(null);
  const [insight, setInsight] = useState<AdminPostInsight | null>(null);
  const [comments, setComments] = useState<AdminPostComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPost = useCallback((nextPost: AdminApplicantPost) => {
    const requestId = ++requestIdRef.current;

    setPost(nextPost);
    setInsight(null);
    setComments([]);
    setError(null);
    setIsLoading(true);

    void Promise.all([
      getAdminPostInsight(nextPost.id),
      getAdminPostComments(nextPost.id),
    ])
      .then(([nextInsight, nextComments]) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setInsight(nextInsight);
        setComments(nextComments);
      })
      .catch((loadError: unknown) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "게시물 상세 정보를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });
  }, []);

  const closePost = useCallback(() => {
    requestIdRef.current += 1;
    setPost(null);
    setInsight(null);
    setComments([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    closePost,
    comments,
    error,
    insight,
    isLoading,
    openPost,
    post,
  };
}
