import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PromotionRequestStatus } from "../../features/promotion/api";
import {
  fontSize,
  fontWeight,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

export const PROMOTION_LABEL = "프로 계정";

type PromotionCardProps = {
  cooldownDaysRemaining: number;
  isLoading: boolean;
  isSubmitting: boolean;
  onRequest: () => void;
  status: PromotionRequestStatus | null;
};

function getButtonState({
  cooldownDaysRemaining,
  isLoading,
  isSubmitting,
  status,
}: Omit<PromotionCardProps, "onRequest">) {
  if (isLoading) {
    return { disabled: true, label: "상태 확인 중" };
  }
  if (isSubmitting) {
    return { disabled: true, label: "신청 중" };
  }
  if (status === "pending") {
    return { disabled: true, label: "심사 중" };
  }
  if (status === "approved") {
    return { disabled: true, label: "승인 완료" };
  }
  if (status === "rejected" && cooldownDaysRemaining > 0) {
    return {
      disabled: true,
      label: `${cooldownDaysRemaining}일 후 재신청 가능`,
    };
  }
  return { disabled: false, label: "신청하기" };
}

export function PromotionCard(props: PromotionCardProps) {
  const styles = useThemedStyles(makeStyles);
  const buttonState = getButtonState(props);
  const statusMessage =
    props.status === "pending"
      ? "신청이 접수됐어요. 결과는 알림으로 알려드려요."
      : props.status === "approved"
        ? `${PROMOTION_LABEL} 승인이 완료됐어요.`
        : null;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{PROMOTION_LABEL}</Text>
      <Text style={styles.title}>{PROMOTION_LABEL} 되기</Text>
      <Text style={styles.benefit}>
        전체 인사이트·콘텐츠 성과가 열려요
      </Text>
      <Text style={styles.requirement}>
        게시물 10개 이상 · 최근 30일 게시물 3개 이상 필요
      </Text>

      {statusMessage ? (
        <Text style={styles.statusMessage}>{statusMessage}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: buttonState.disabled }}
        disabled={buttonState.disabled}
        onPress={props.onRequest}
        style={({ pressed }) => [
          styles.button,
          buttonState.disabled ? styles.buttonDisabled : null,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.buttonText,
            buttonState.disabled ? styles.buttonTextDisabled : null,
          ]}
        >
          {buttonState.label}
        </Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: c.navBackground,
    padding: 18,
  },
  eyebrow: {
    color: c.brand,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  title: {
    marginTop: 8,
    color: c.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  benefit: {
    marginTop: 6,
    color: c.muted,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  requirement: {
    marginTop: 10,
    color: c.textFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
  },
  statusMessage: {
    marginTop: 14,
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    lineHeight: 19,
  },
  button: {
    minHeight: 42,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: c.accent,
    paddingHorizontal: 14,
  },
  buttonDisabled: {
    backgroundColor: c.neutralFill,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonText: {
    color: c.onAccent,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  buttonTextDisabled: {
    color: c.muted,
  },
});
