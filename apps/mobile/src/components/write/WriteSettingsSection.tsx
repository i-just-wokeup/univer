import { StyleSheet, Text, View } from "react-native";

import { VisibilityPicker } from "../../components/common/VisibilityPicker";
import type {
  PostAspectRatio,
  PostVisibility,
} from "../../features/feed/types";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { PostAspectRatioPicker } from "./PostAspectRatioPicker";

type WriteSettingsSectionProps = {
  aspectRatio: PostAspectRatio;
  onChangeAspectRatio: (value: PostAspectRatio) => void;
  onChangeVisibility: (value: PostVisibility) => void;
  visibility: PostVisibility;
};

export function WriteSettingsSection({
  aspectRatio,
  onChangeAspectRatio,
  onChangeVisibility,
  visibility,
}: WriteSettingsSectionProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>비율</Text>
        <PostAspectRatioPicker
          onChange={onChangeAspectRatio}
          value={aspectRatio}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>공개 범위</Text>
        <VisibilityPicker onChange={onChangeVisibility} value={visibility} />
      </View>
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: c.card,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: c.text,
    fontSize: 15,
    fontWeight: "900",
  },
});
