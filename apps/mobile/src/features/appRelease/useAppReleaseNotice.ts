import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";

import { useSession } from "../../lib/session";
import {
  getAppRelease,
  type AppRelease,
  type AppReleasePlatform,
} from "./api";

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const LAST_RELEASE_KEY = "appRelease.lastRelease";
const LAST_CHECKED_AT_KEY = "appRelease.lastCheckedAt";
const LAST_NOTICED_VERSION_KEY = "appRelease.lastNoticedVersion";

type ReleaseNotice = {
  isForced: boolean;
  release: AppRelease;
  userId: string;
};

function getPlatform(): AppReleasePlatform | null {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    return Platform.OS;
  }

  return null;
}

function getStorageKey(prefix: string, platform: AppReleasePlatform) {
  return `${prefix}.${platform}`;
}

async function getStoredValue(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function setStoredValue(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // 업데이트 확인 상태 저장 실패가 앱 사용을 막아서는 안 된다.
  }
}

async function removeStoredValue(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // 캐시 정리 실패도 앱 사용에 영향을 주지 않는다.
  }
}

function isAppRelease(value: unknown): value is AppRelease {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const release = value as Record<string, unknown>;
  return (
    (release.platform === "android" || release.platform === "ios") &&
    typeof release.latest_version === "string" &&
    (release.min_version === null ||
      typeof release.min_version === "string") &&
    typeof release.store_url === "string"
  );
}

async function getCachedRelease(
  platform: AppReleasePlatform,
): Promise<AppRelease | null> {
  const value = await getStoredValue(getStorageKey(LAST_RELEASE_KEY, platform));
  if (!value) {
    return null;
  }

  try {
    const release: unknown = JSON.parse(value);
    return isAppRelease(release) && release.platform === platform
      ? release
      : null;
  } catch {
    return null;
  }
}

export function compareAppVersions(left: string, right: string): number {
  const leftParts = left.split(".");
  const rightParts = right.split(".");
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = Number.parseInt(leftParts[index] ?? "0", 10);
    const rightPart = Number.parseInt(rightParts[index] ?? "0", 10);
    const safeLeftPart = Number.isFinite(leftPart) ? leftPart : 0;
    const safeRightPart = Number.isFinite(rightPart) ? rightPart : 0;

    if (safeLeftPart > safeRightPart) {
      return 1;
    }

    if (safeLeftPart < safeRightPart) {
      return -1;
    }
  }

  return 0;
}

export function useAppReleaseNotice() {
  const { isOnboardingLoading, requiresOnboarding, session } = useSession();
  const [notice, setNotice] = useState<ReleaseNotice | null>(null);
  const activeCheckKeyRef = useRef<string | null>(null);
  const platform = getPlatform();
  const currentVersion = Constants.expoConfig?.version ?? null;

  useEffect(() => {
    const userId = session?.user.id;
    const canCheck = Boolean(
      userId &&
        platform &&
        currentVersion &&
        !isOnboardingLoading &&
        !requiresOnboarding,
    );

    if (!canCheck || !userId || !platform || !currentVersion) {
      activeCheckKeyRef.current = null;
      return;
    }

    const activeCheckKey = `${userId}.${platform}.${currentVersion}`;
    if (activeCheckKeyRef.current === activeCheckKey) {
      return;
    }
    activeCheckKeyRef.current = activeCheckKey;

    void (async () => {
      const lastCheckedAtKey = getStorageKey(
        LAST_CHECKED_AT_KEY,
        platform,
      );
      const lastCheckedAtValue = await getStoredValue(lastCheckedAtKey);
      const lastCheckedAt = Number(lastCheckedAtValue);
      const now = Date.now();

      const checkedRecently =
        lastCheckedAtValue !== null &&
        Number.isFinite(lastCheckedAt) &&
        now - lastCheckedAt >= 0 &&
        now - lastCheckedAt < CHECK_INTERVAL_MS;

      let release = checkedRecently
        ? await getCachedRelease(platform)
        : null;

      if (!checkedRecently) {
        await setStoredValue(lastCheckedAtKey, String(now));
        release = await getAppRelease(platform);

        const releaseCacheKey = getStorageKey(LAST_RELEASE_KEY, platform);
        if (release) {
          await setStoredValue(releaseCacheKey, JSON.stringify(release));
        } else {
          await removeStoredValue(releaseCacheKey);
        }
      }

      if (!release || activeCheckKeyRef.current !== activeCheckKey) {
        return;
      }

      const isUpdateAvailable =
        compareAppVersions(currentVersion, release.latest_version) < 0;
      const isForced = Boolean(
        release.min_version &&
          compareAppVersions(currentVersion, release.min_version) < 0,
      );

      if (!isUpdateAvailable && !isForced) {
        return;
      }

      const lastNoticedVersion = await getStoredValue(
        getStorageKey(LAST_NOTICED_VERSION_KEY, platform),
      );
      if (activeCheckKeyRef.current !== activeCheckKey) {
        return;
      }

      if (!isForced && lastNoticedVersion === release.latest_version) {
        return;
      }

      setNotice({ isForced, release, userId });
    })();
  }, [
    currentVersion,
    isOnboardingLoading,
    platform,
    requiresOnboarding,
    session?.user.id,
  ]);

  const rememberAndClose = useCallback(() => {
    if (!notice || notice.isForced) {
      return;
    }

    setNotice(null);
    void setStoredValue(
      getStorageKey(LAST_NOTICED_VERSION_KEY, notice.release.platform),
      notice.release.latest_version,
    );
  }, [notice]);

  const openStore = useCallback(() => {
    if (!notice) {
      return;
    }

    const currentNotice = notice;
    void Linking.openURL(currentNotice.release.store_url)
      .catch(() => undefined)
      .finally(() => {
        if (!currentNotice.isForced) {
          setNotice(null);
          void setStoredValue(
            getStorageKey(
              LAST_NOTICED_VERSION_KEY,
              currentNotice.release.platform,
            ),
            currentNotice.release.latest_version,
          );
        }
      });
  }, [notice]);

  const isNoticeVisible = Boolean(
    notice &&
      notice.userId === session?.user.id &&
      !isOnboardingLoading &&
      !requiresOnboarding,
  );

  return {
    canCancel: !notice?.isForced,
    isOpen: isNoticeVisible,
    onCancel: rememberAndClose,
    onConfirm: openStore,
  };
}
