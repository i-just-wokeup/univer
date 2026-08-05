import { StyleSheet, Switch, Text, View } from "react-native";

import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ProfileEditPrivacyTogglesProps = {
  departmentPublic: boolean;
  onChangeDepartmentPublic: (value: boolean) => void;
  onChangeRealNamePublic: (value: boolean) => void;
  realNamePublic: boolean;
};

export function ProfileEditPrivacyToggles({
  departmentPublic,
  onChangeDepartmentPublic,
  onChangeRealNamePublic,
  realNamePublic,
}: ProfileEditPrivacyTogglesProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.group}>
      <PrivacyToggleRow
        description="켜면 이름이 공개돼요"
        label="이름 공개"
        onValueChange={onChangeRealNamePublic}
        value={realNamePublic}
      />
      <View style={styles.divider} />
      <PrivacyToggleRow
        description="켜면 학과가 공개돼요"
        label="학과 공개"
        onValueChange={onChangeDepartmentPublic}
        value={departmentPublic}
      />
    </View>
  );
}

type PrivacyToggleRowProps = {
  description: string;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
};

function PrivacyToggleRow({
  description,
  label,
  onValueChange,
  value,
}: PrivacyToggleRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      <View style={styles.textColumn}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        ios_backgroundColor={colors.switchTrackOff}
        onValueChange={onValueChange}
        thumbColor={value ? colors.onAccent : colors.switchThumb}
        trackColor={{
          false: colors.switchTrackOff,
          true: colors.accentTrack,
        }}
        value={value}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  group: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: c.accentTintBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textColumn: {
    minWidth: 0,
    flex: 1,
  },
  label: {
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  description: {
    marginTop: 4,
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: c.overlayInkFaint,
  },
});
