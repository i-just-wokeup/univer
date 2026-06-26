import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { useSession } from "../../lib/session";
import {
  getNotificationTargetFromPushData,
  routeToNotificationTarget,
} from "./navigation";
import {
  Notifications,
  registerForPushNotifications,
} from "./push";

export function usePushNotifications() {
  const router = useRouter();
  const {
    isOnboardingLoading,
    requiresOnboarding,
    session,
  } = useSession();
  const registeredUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const target = getNotificationTargetFromPushData(
          response.notification.request.content.data,
        );
        routeToNotificationTarget(router, target);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    const userId = session?.user.id ?? null;

    if (!userId || isOnboardingLoading || requiresOnboarding) {
      registeredUserIdRef.current = null;
      return;
    }

    if (registeredUserIdRef.current === userId) {
      return;
    }

    registeredUserIdRef.current = userId;
    void registerForPushNotifications().catch(() => {
      registeredUserIdRef.current = null;
    });
  }, [isOnboardingLoading, requiresOnboarding, session?.user.id]);
}
