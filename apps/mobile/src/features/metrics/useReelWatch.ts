import { useEventListener } from "expo";
import type { VideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { recordReelWatch } from "./api";

const COMPLETION_THRESHOLD = 0.95;
const LOOP_END_THRESHOLD = 0.85;
const LOOP_START_THRESHOLD = 0.15;
const MIN_WATCH_SECONDS = 1;

type ReelWatchSession = {
  durationSeconds: number;
  eventId: string;
  firstPlayMaxPct: number;
  looped: boolean;
  loops: number;
  ownerId: string;
  postId: string;
  previousPct: number | null;
  previousTime: number | null;
  watchedSeconds: number;
};

type UseReelWatchParams = {
  isActive: boolean;
  ownerId: string;
  player: VideoPlayer;
  postId: string;
};

function createEventId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const random = Math.floor(Math.random() * 16);
    const value = token === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function readPlayerPosition(player: VideoPlayer): {
  currentTime: number;
  duration: number;
} {
  try {
    return {
      currentTime: Math.max(0, player.currentTime),
      duration: Math.max(0, player.duration),
    };
  } catch {
    return { currentTime: 0, duration: 0 };
  }
}

export function useReelWatch({
  isActive,
  ownerId,
  player,
  postId,
}: UseReelWatchParams): void {
  const activeRef = useRef(isActive);
  const playingRef = useRef(false);
  const sessionRef = useRef<ReelWatchSession | null>(null);

  const finishSession = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;

    if (
      !session ||
      session.watchedSeconds < MIN_WATCH_SECONDS ||
      session.durationSeconds <= 0
    ) {
      return;
    }

    const maxPct = Math.min(
      100,
      Math.max(0, Math.round(session.firstPlayMaxPct * 100)),
    );

    void recordReelWatch({
      completed: session.looped || session.firstPlayMaxPct >= COMPLETION_THRESHOLD,
      eventId: session.eventId,
      loops: Math.min(32767, session.loops),
      maxPct,
      ownerId: session.ownerId,
      postId: session.postId,
      videoDurationMs: Math.round(session.durationSeconds * 1000),
    });
  }, []);

  const startSession = useCallback(() => {
    if (!activeRef.current || !playingRef.current || sessionRef.current) {
      return;
    }

    const { currentTime, duration } = readPlayerPosition(player);
    const initialPct = duration > 0 ? Math.min(1, currentTime / duration) : 0;
    sessionRef.current = {
      durationSeconds: duration,
      eventId: createEventId(),
      firstPlayMaxPct: initialPct,
      looped: false,
      loops: 0,
      ownerId,
      postId,
      previousPct: duration > 0 ? initialPct : null,
      previousTime: duration > 0 ? currentTime : null,
      watchedSeconds: 0,
    };
  }, [ownerId, player, postId]);

  useEventListener(player, "playingChange", ({ isPlaying }) => {
    playingRef.current = isPlaying;
    if (isPlaying) {
      startSession();
    }
  });

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    if (!activeRef.current || !playingRef.current) {
      return;
    }

    startSession();
    const session = sessionRef.current;
    if (!session) {
      return;
    }

    const { duration } = readPlayerPosition(player);
    if (duration <= 0) {
      return;
    }

    session.durationSeconds = duration;
    const safeCurrentTime = Math.min(duration, Math.max(0, currentTime));
    const pct = Math.min(1, safeCurrentTime / duration);
    const didLoop =
      session.previousPct !== null &&
      session.previousPct > LOOP_END_THRESHOLD &&
      pct < LOOP_START_THRESHOLD;

    if (session.previousTime !== null) {
      if (didLoop) {
        session.watchedSeconds +=
          Math.max(0, duration - session.previousTime) + safeCurrentTime;
      } else if (safeCurrentTime >= session.previousTime) {
        session.watchedSeconds += safeCurrentTime - session.previousTime;
      }
    }

    if (didLoop) {
      session.loops += 1;
      session.looped = true;
    } else if (!session.looped) {
      session.firstPlayMaxPct = Math.max(session.firstPlayMaxPct, pct);
    }

    session.previousPct = pct;
    session.previousTime = safeCurrentTime;
  });

  useEffect(() => {
    activeRef.current = isActive;
    if (!isActive) {
      playingRef.current = false;
      finishSession();
      return;
    }

    try {
      playingRef.current = player.playing;
    } catch {
      playingRef.current = false;
    }
    startSession();
  }, [finishSession, isActive, player, startSession]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        playingRef.current = false;
        finishSession();
        return;
      }

      try {
        playingRef.current = player.playing;
      } catch {
        playingRef.current = false;
      }
      startSession();
    });

    return () => subscription.remove();
  }, [finishSession, player, startSession]);

  // FlatList가 셀을 다른 게시물로 재사용하는 경우에도 이전 게시물 세션을 먼저 확정한다.
  useEffect(() => finishSession, [finishSession, ownerId, postId]);
}
