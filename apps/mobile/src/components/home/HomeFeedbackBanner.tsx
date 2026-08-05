import { StyleSheet, Text, View } from "react-native";

import type { HomeFeedbackState } from "../../features/feed/useHomeFeedFeedback";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type HomeFeedbackBannerProps = {
  errorMessage: string;
  feedback: HomeFeedbackState;
};

export function HomeFeedbackBanner({
  errorMessage,
  feedback,
}: HomeFeedbackBannerProps) {
  const styles = useThemedStyles(makeStyles);

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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  inlineError: {
    position: "absolute",
    right: 16,
    bottom: 96,
    left: 16,
    borderRadius: 16,
    backgroundColor: c.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inlineFeedback: {
    position: "absolute",
    right: 16,
    bottom: 96,
    left: 16,
    borderRadius: 16,
    backgroundColor: c.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inlineFeedbackError: {
    backgroundColor: c.danger,
  },
  inlineText: {
    color: c.onAccent,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
});
