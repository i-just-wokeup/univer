import { NativeModulesProxy } from "expo-modules-core";
import { usePathname } from "expo-router";
import { useEffect } from "react";
import {
  AppState,
  Platform,
  StatusBar as NativeStatusBar,
} from "react-native";

import { colors } from "./theme";

let navigationBarModule:
  | typeof import("expo-navigation-bar")
  | null
  | undefined;

type SystemBarPreset = {
  navigationBackgroundColor: string;
  navigationButtonStyle: "dark" | "light";
  statusBackgroundColor: string;
  statusBarStyle: "dark-content" | "light-content";
};

const defaultPreset: SystemBarPreset = {
  navigationBackgroundColor: colors.white,
  navigationButtonStyle: "dark",
  statusBackgroundColor: colors.accentSoft,
  statusBarStyle: "dark-content",
};

const storyPreset: SystemBarPreset = {
  navigationBackgroundColor: "#000000",
  navigationButtonStyle: "light",
  statusBackgroundColor: "#000000",
  statusBarStyle: "light-content",
};

function getPreset(pathname: string): SystemBarPreset {
  if (pathname.startsWith("/story/") && pathname !== "/story/create") {
    return storyPreset;
  }

  return defaultPreset;
}

function getNavigationStyle(buttonStyle: "dark" | "light") {
  return buttonStyle === "dark" ? "light" : "dark";
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

  NativeStatusBar.setTranslucent(false);
  NativeStatusBar.setBackgroundColor(preset.statusBackgroundColor);

  const NavigationBar = getNavigationBar();

  if (!NavigationBar) {
    return;
  }

  try {
    await NavigationBar.setVisibilityAsync("visible");
    await NavigationBar.setPositionAsync("relative");
    await NavigationBar.setBehaviorAsync("inset-touch");
    await NavigationBar.setBackgroundColorAsync(preset.navigationBackgroundColor);
    await NavigationBar.setBorderColorAsync(preset.navigationBackgroundColor);
    await NavigationBar.setButtonStyleAsync(preset.navigationButtonStyle);
    NavigationBar.setStyle(getNavigationStyle(preset.navigationButtonStyle));
  } catch {
    // 일부 Android edge-to-edge 상태에서는 배경색 API가 no-op/warn 처리된다.
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
