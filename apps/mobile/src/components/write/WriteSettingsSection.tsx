import { StyleSheet, Text, View } from "react-native";

import { VisibilityPicker } from "../../components/common/VisibilityPicker";
import type {
  PostAspectRatio,
  PostVisibility,
} from "../../features/feed/types";
import { colors } from "../../lib/theme";
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

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    backgroundColor: colors.card,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
});
