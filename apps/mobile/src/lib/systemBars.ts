import { NativeModulesProxy } from "expo-modules-core";
import { usePathname } from "expo-router";
import { useEffect } from "react";
import {
  AppState,
  Platform,
  StatusBar as NativeStatusBar,
} from "react-native";

let navigationBarModule:
  | typeof import("expo-navigation-bar")
  | null
  | undefined;

type SystemBarPreset = {
  navigationButtonStyle: "dark" | "light";
  statusBarStyle: "dark-content" | "light-content";
};

const defaultPreset: SystemBarPreset = {
  navigationButtonStyle: "dark",
  statusBarStyle: "dark-content",
};

const immersivePreset: SystemBarPreset = {
  navigationButtonStyle: "light",
  statusBarStyle: "light-content",
};

function isImmersiveRoute(pathname: string) {
  return (
    pathname === "/reels" ||
    (pathname.startsWith("/story/") && pathname !== "/story/create")
  );
}

function getPreset(pathname: string): SystemBarPreset {
  if (isImmersiveRoute(pathname)) {
    return immersivePreset;
  }

  return defaultPreset;
}

function getNavigationBar() {
  if (Platform.OS !== "android") {
    return null;
  }

  if (navigationBarModule !== undefined) {
    return navigationBarModule;
  }

  if (!NativeModulesProxy.ExpoNavigationBar) {
    navigationBarModule = null;
    return navigationBarModule;
  }

  try {
    // 현재 설치된 dev build에 native module이 없을 수 있어 런타임 optional 로드로 둔다.
    navigationBarModule = require("expo-navigation-bar") as typeof import("expo-navigation-bar");
  } catch {
    navigationBarModule = null;
  }

  return navigationBarModule;
}

export async function applySystemBars(preset: SystemBarPreset): Promise<void> {
  NativeStatusBar.setBarStyle(preset.statusBarStyle);

  if (Platform.OS !== "android") {
    return;
  }

  NativeStatusBar.setTranslucent(true);
  NativeStatusBar.setBackgroundColor("transparent");

  const NavigationBar = getNavigationBar();

  if (!NavigationBar) {
    return;
  }

  try {
    await NavigationBar.setVisibilityAsync("visible");
    await NavigationBar.setButtonStyleAsync(preset.navigationButtonStyle);
  } catch {
    // Edge-to-edge에서는 배경/position 계열 API가 OS 버전에 따라 no-op일 수 있다.
    // AppState 복귀 시 반복 적용하므로 여기서는 화면 렌더를 막지 않는다.
  }
}

export function SystemBarsController() {
  const pathname = usePathname();
  const preset = getPreset(pathname);

  useEffect(() => {
    const timeoutIds = new Set<ReturnType<typeof setTimeout>>();

    function scheduleApply() {
      void applySystemBars(preset);

      [80, 240].forEach((delay) => {
        const timeoutId = setTimeout(() => {
          void applySystemBars(preset);
          timeoutIds.delete(timeoutId);
        }, delay);

        timeoutIds.add(timeoutId);
      });
    }

    scheduleApply();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        scheduleApply();
      }
    });

    return () => {
      subscription.remove();
      timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [preset]);

  return null;
}
