import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { useColorScheme } from "react-native";

type ThemeScheme = "dark" | "light";

type ThemeContextValue<TColors> = {
  colors: TColors;
  scheme: ThemeScheme;
};

type ThemePalettes<TColors> = {
  darkColors: TColors;
  lightColors: TColors;
};

export function createThemeBindings<TColors extends Record<string, string>>({
  darkColors,
  lightColors,
}: ThemePalettes<TColors>) {
  const ThemeContext = createContext<ThemeContextValue<TColors> | null>(null);

  function ThemeProvider({ children }: PropsWithChildren) {
    const systemScheme = useColorScheme();
    const scheme: ThemeScheme = systemScheme === "dark" ? "dark" : "light";
    const colors = scheme === "dark" ? darkColors : lightColors;
    const value = useMemo(
      () => ({ colors, scheme }),
      [colors, scheme],
    );

    return (
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
  }

  function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
      throw new Error("useTheme must be used within ThemeProvider");
    }

    return context;
  }

  function useThemedStyles<TStyles>(
    factory: (colors: TColors) => TStyles,
  ): TStyles {
    const { colors, scheme } = useTheme();

    return useMemo(
      () => factory(colors),
      [colors, factory, scheme],
    );
  }

  return { ThemeProvider, useTheme, useThemedStyles };
}
