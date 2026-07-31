import { StyleSheet, Text, View, type GestureResponderHandlers } from "react-native";

import { colors } from "../../lib/theme";

type CommentsSheetHeaderProps = {
  panHandlers: GestureResponderHandlers;
};

// 시트 상단의 드래그 핸들과 제목. 드래그 제스처는 부모 시트가 소유한다.
export function CommentsSheetHeader({ panHandlers }: CommentsSheetHeaderProps) {
  return (
    <>
      <View style={styles.dragArea} {...panHandlers}>
        <View style={styles.handle} />
      </View>
      <View style={styles.header} {...panHandlers}>
        <Text style={styles.title}>댓글</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    height: 5,
    width: 42,
    borderRadius: 999,
    backgroundColor: colors.lavenderTint,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
});
