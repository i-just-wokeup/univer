import { useCallback } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";

import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ExternalShareSectionProps = {
  insetsBottom: number;
  url: string;
};

export function ExternalShareSection({
  insetsBottom,
  url,
}: ExternalShareSectionProps) {
  const styles = useThemedStyles(makeStyles);
  const handleExternalShare = useCallback(() => {
    void Share.share({
      message: url,
      title: "UNIVER 게시물",
      url,
    });
  }, [url]);

  return (
    <View
      style={[
        styles.externalShare,
        { paddingBottom: insetsBottom + 16 },
      ]}
    >
      <Text style={styles.externalTitle}>외부 공유</Text>
      <Pressable
        accessibilityRole="button"
        onPress={handleExternalShare}
        style={({ pressed }) => [
          styles.externalButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.externalButtonText}>공유하기</Text>
        <Text style={styles.externalButtonMeta} numberOfLines={1}>
          {url}
        </Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  externalShare: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  externalTitle: {
    marginBottom: 8,
    color: c.textFaint,
    fontSize: 12,
    fontWeight: "900",
  },
  externalButton: {
    borderRadius: 18,
    backgroundColor: c.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  externalButtonText: {
    color: c.text,
    fontSize: 14,
    fontWeight: "900",
  },
  externalButtonMeta: {
    marginTop: 3,
    color: c.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});
