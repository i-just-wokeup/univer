import type { StoryGroup } from "./types";

type StoryViewerSession = {
  groups: StoryGroup[];
  startStoryId: string | null;
  startUserId: string;
  expiresAt: number;
};

const SESSION_TTL_MS = 60_000;
let session: StoryViewerSession | null = null;

// 홈 스토리바에서 이미 렌더한 그룹 목록을 뷰어에 넘긴다.
// 라우트 params에 큰 JSON을 싣지 않기 위한 앱 내부 단기 캐시다.
export function primeStoryViewerSession(
  groups: StoryGroup[],
  startUserId: string,
  startStoryId: string | null,
) {
  session = {
    expiresAt: Date.now() + SESSION_TTL_MS,
    groups,
    startStoryId,
    startUserId,
  };
}

export function getPrimedStoryViewerSession(userId: string) {
  if (!session || session.expiresAt < Date.now()) {
    session = null;
    return null;
  }

  const currentSession = session;

  if (currentSession.startUserId !== userId) {
    return null;
  }

  const startIndex = currentSession.groups.findIndex(
    (group) => group.user.id === userId,
  );

  if (startIndex < 0) {
    return null;
  }

  const startGroup = currentSession.groups[startIndex];
  const startStoryIndex = currentSession.startStoryId
    ? startGroup.stories.findIndex(
        (story) => story.id === currentSession.startStoryId,
      )
    : 0;

  if (currentSession.startStoryId && startStoryIndex < 0) {
    return null;
  }

  return {
    groups: currentSession.groups,
    startIndex,
    startStoryIndex: Math.max(0, startStoryIndex),
  };
}
