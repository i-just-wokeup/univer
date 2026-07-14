import type { TextInputProps } from "react-native";

// 로그인/자격증명 칸이 아닌 일반 입력칸에 스프레드해서 자동완성(삼성패스 등) 오탐을 막는다.
// OS에 "이 칸은 자동완성 대상 아님"을 명시 → 비밀번호 저장 팝업/오분류 방지.
export const noAutofillTextInputProps: Pick<
  TextInputProps,
  "autoComplete" | "importantForAutofill" | "textContentType"
> = {
  autoComplete: "off",
  importantForAutofill: "no",
  textContentType: "none",
};
