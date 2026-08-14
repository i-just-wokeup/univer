import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getContentPerformance,
  getMetricCounts,
  type ContentPerformance,
} from "./api";

export type ContentPerformanceSort = "popular" | "recent";

function totalEngagement(item: ContentPerformance): number {
  return item.likes + item.comments + item.saves + item.shares;
}

export function useContentPerformance(enabled: boolean) {
  const requestIdRef = useRef(0);
  const [items, setItems] = useState<ContentPerformance[]>([]);
  const [sort, setSort] = useState<ContentPerformanceSort>("popular");
  const [isLoading, setIsLoading] = useState(enabled);
  const [errorMessage, setErrorMessage] = useState("");
  const [views, setViews] = useState(0);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!enabled) {
      setItems([]);
      setViews(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [nextItems, reelViews, postViews] = await Promise.all([
        getContentPerformance(),
        getMetricCounts("reel_view"),
        getMetricCounts("post_view"),
      ]);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems(nextItems);
      setViews(reelViews.total + postViews.total);
    } catch {
      if (requestId === requestIdRef.current) {
        setErrorMessage("콘텐츠 성과를 불러오지 못했습니다.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      if (sort === "popular") {
        const engagementDifference =
          totalEngagement(right) - totalEngagement(left);
        if (engagementDifference !== 0) {
          return engagementDifference;
        }
      }
      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });
  }, [items, sort]);

  const totals = useMemo(
    () => items.reduce(
      (sum, item) => ({
        comments: sum.comments + item.comments,
        likes: sum.likes + item.likes,
        saves: sum.saves + item.saves,
        shares: sum.shares + item.shares,
        total: sum.total + totalEngagement(item),
        views,
      }),
      { comments: 0, likes: 0, saves: 0, shares: 0, total: 0, views },
    ),
    [items, views],
  );

  return {
    errorMessage,
    isLoading,
    items: sortedItems,
    reload: load,
    setSort,
    sort,
    totals,
  };
}
