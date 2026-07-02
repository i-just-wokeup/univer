import { type ReactNode, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";

type ExpandableTextProps = {
  children: ReactNode;
  // 접힌 상태에서 보여줄 최대 줄 수.
  collapsedLines: number;
  moreLabel?: string;
  moreStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
};

// 본문을 collapsedLines로 접고, 잘렸을 때만 "더보기"를 띄워 펼치는 공용 텍스트.
// 잘렸을 땐 본문을 탭해서 펼치고, 펼친 상태에서 다시 탭하면 접힌다(인스타식, 접기 버튼 없음).
// 잘림 판정은 clamp 없는 숨김 텍스트로 전체 줄 수를 재서 안드로이드/iOS 모두 안정적으로 처리한다.
export function ExpandableText({
  children,
  collapsedLines,
  moreLabel = "더보기",
  moreStyle,
  textStyle,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState<boolean | null>(null);

  const canToggle = isTruncated === true;

  return (
    <View>
      {isTruncated === null ? (
        <Text
          onTextLayout={(event) => {
            setIsTruncated(event.nativeEvent.lines.length > collapsedLines);
          }}
          style={[textStyle, styles.measure]}
        >
          {children}
        </Text>
      ) : null}

      <Pressable
        disabled={!canToggle}
        onPress={() => setIsExpanded((prev) => !prev)}
      >
        <Text
          numberOfLines={isExpanded ? undefined : collapsedLines}
          style={textStyle}
        >
          {children}
        </Text>
      </Pressable>

      {canToggle && !isExpanded ? (
        <Pressable hitSlop={6} onPress={() => setIsExpanded(true)}>
          <Text style={moreStyle}>{moreLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 측정 전용: 화면에 안 보이고 레이아웃도 차지하지 않게 하되 실제 폭은 동일하게 유지.
  measure: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },
});
