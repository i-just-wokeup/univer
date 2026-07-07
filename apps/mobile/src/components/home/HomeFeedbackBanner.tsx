import { StyleSheet, Text, View } from "react-native";

import type { HomeFeedbackState } from "../../features/feed/useHomeFeedFeedback";
import { colors } from "../../lib/theme";

type HomeFeedbackBannerProps = {
  errorMessage: string;
  feedback: HomeFeedbackState;
};

export function HomeFeedbackBanner({
  errorMessage,
  feedback,
}: HomeFeedbackBannerProps) {
  return (
    <>
      {errorMessage ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineText}>{errorMessage}</Text>
        </View>
      ) : null}
      {feedback ? (
        <View
          style={[
            styles.inlineFeedback,
            feedback.type === "error" ? styles.inlineFeedbackError : null,
          ]}
        >
          <Text style={styles.inlineText}>{feedback.message}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  inlineError: {
    position: "absolute",
    right: 16,
    bottom: 96,
    left: 16,
    borderRadius: 16,
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inlineFeedback: {
    position: "absolute",
    right: 16,
    bottom: 96,
    left: 16,
    borderRadius: 16,
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inlineFeedbackError: {
    backgroundColor: colors.danger,
  },
  inlineText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
