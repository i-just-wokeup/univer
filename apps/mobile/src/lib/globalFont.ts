import { cloneElement } from "react";
import type { ReactElement } from "react";
import { Text, TextInput } from "react-native";

type StyledElement = ReactElement<{ style?: unknown }>;

// 앱 전역 기본 폰트를 Pretendard로 지정한다.
// - config plugin(app.json)으로 폰트를 네이티브에 임베드하므로 런타임 로딩(useFonts) 불필요.
// - fontFamily만 스타일 배열 맨 앞에 얹으므로, 각 컴포넌트가 지정한 fontWeight/색상 등은 그대로 유지된다.
// - 폰트가 없는 환경(빌드 전 개발 서버 등)에서는 자동으로 시스템 폰트로 폴백된다.
const FONT_FAMILY = "Pretendard";

type Renderable = {
  render?: (...args: unknown[]) => StyledElement | null;
};

function applyDefaultFontFamily(Component: Renderable) {
  const original = Component.render;

  if (typeof original !== "function") {
    return;
  }

  Component.render = function patchedRender(...args: unknown[]) {
    const element = original.apply(this, args);

    if (!element) {
      return element;
    }

    return cloneElement(element, {
      style: [{ fontFamily: FONT_FAMILY }, element.props.style],
    });
  };
}

applyDefaultFontFamily(Text as unknown as Renderable);
applyDefaultFontFamily(TextInput as unknown as Renderable);
