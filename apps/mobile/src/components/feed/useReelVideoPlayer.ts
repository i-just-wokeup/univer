import { useEffect, useState } from "react";
import { useVideoPlayer } from "expo-video";

type UseReelVideoPlayerParams = {
  isActive: boolean;
  isMuted: boolean;
  isNearActive: boolean;
  isReady: boolean;
  videoUrl: string | null;
};

export function useReelVideoPlayer({
  isActive,
  isMuted,
  isNearActive,
  isReady,
  videoUrl,
}: UseReelVideoPlayerParams) {
  const [isPaused, setIsPaused] = useState(false);

  // 초기엔 빈 소스. 가까워지면 replace로 실제 영상을, 멀어지면 null로 교체해 메모리를 푼다.
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = true;
    // 8MB 캡은 과거 무압축 mp4 시절 OOM 방지용이었는데, 지금은 Cloudflare HLS(조각 스트리밍)라
    // 통째로 RAM에 안 올라감 → 캡 제거해 좋은 네트워크에서 더 높은 화질(1080p)을 고를 수 있게 한다.
    instance.bufferOptions = {
      preferredForwardBufferDuration: 5, // 앞 5초 미리 받기
      minBufferForPlayback: 0.5, // 재생 시작 문턱을 낮춰 되감기 후 멈칫을 줄임
    };
  });

  // 활성 ±1만 소스를 물린다(Mux/TikTok 방식: 창 밖은 source=null로 메모리 해제).
  // 의존성은 문자열 videoUrl(안정)로 — video 객체를 쓰면 매 렌더 재실행돼 폭주한다.
  // replaceAsync로 메인 스레드 블락(UI 프리즈)을 피한다.
  useEffect(() => {
    // 디스크 캐시(useCaching)로 스크롤 되감기/재시청 시 재다운을 막는다.
    const source =
      isNearActive && isReady && videoUrl
        ? { uri: videoUrl, useCaching: true }
        : null;
    void player.replaceAsync(source).catch(() => undefined);
  }, [isNearActive, isReady, player, videoUrl]);

  // 전역 음소거 상태를 플레이어에 반영.
  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  // 화면 밖으로 벗어나면 탭 일시정지는 초기화(다시 활성될 때 자동재생).
  useEffect(() => {
    if (!isActive) {
      setIsPaused(false);
    }
  }, [isActive]);

  // 릴스에서 벗어날 때(비활성) 미리 0초로 되돌려 둔다. 그래야 다시 돌아왔을 때
  // 이미 첫 프레임에 준비돼 있어(썸네일=첫 프레임과 이음새 없이) 바로 처음부터 재생된다.
  // 돌아온 뒤 되감으면 옛 프레임이 찰나 보이므로, 떠날 때 미리 준비하는 방식을 쓴다.
  // (수동 일시정지는 isActive가 유지돼 리셋되지 않아 이어서 재생됨)
  useEffect(() => {
    if (isActive) {
      return;
    }

    try {
      player.currentTime = 0;
    } catch {
      // 소스 미준비/release 상태면 무시(준비되면 어차피 0부터 시작).
    }
  }, [isActive, player]);

  useEffect(() => {
    try {
      if (isActive && isReady && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // 플레이어가 이미 release된 경우 무시.
    }
  }, [isActive, isPaused, isReady, player]);

  return {
    isPaused,
    player,
    togglePaused: () => setIsPaused((paused) => !paused),
  };
}
