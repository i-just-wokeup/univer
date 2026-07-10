import type { StoryGroup } from "./types";

type StoryViewerSession = {
  groups: StoryGroup[];
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
) {
  session = {
    expiresAt: Date.now() + SESSION_TTL_MS,
    groups,
    startUserId,
  };
}

export function getPrimedStoryViewerSession(userId: string) {
  if (!session || session.expiresAt < Date.now()) {
    session = null;
    return null;
  }

  const startIndex = session.groups.findIndex(
    (group) => group.user.id === userId,
  );

  if (startIndex < 0) {
    return null;
  }

  return {
    groups: session.groups,
    startIndex,
  };
}
