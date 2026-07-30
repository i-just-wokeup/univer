import { StyleSheet, Switch, Text, View } from "react-native";

import { colors } from "../../lib/theme";

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
  return (
    <View style={styles.group}>
      <PrivacyToggleRow
        description="끄면 크루에게만 보여요"
        label="실명 공개"
        onValueChange={onChangeRealNamePublic}
        value={realNamePublic}
      />
      <View style={styles.divider} />
      <PrivacyToggleRow
        description="끄면 나만 볼 수 있어요"
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
  return (
    <View style={styles.row}>
      <View style={styles.textColumn}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        ios_backgroundColor="rgba(154,157,168,0.36)"
        onValueChange={onValueChange}
        thumbColor={colors.white}
        trackColor={{
          false: "rgba(154,157,168,0.36)",
          true: "rgba(124,58,237,0.36)",
        }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: "rgba(124,58,237,0.06)",
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
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  description: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: "rgba(20,22,30,0.07)",
  },
});
