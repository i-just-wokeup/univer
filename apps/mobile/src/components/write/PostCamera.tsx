import { StatusBar } from "expo-status-bar";
import { Modal, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";

import type { PostCapturedPhoto } from "../../features/feed/postMediaLibrary";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { CameraCaptureView } from "../camera/CameraCaptureView";

type PostCameraProps = {
  onCaptured: (photo: PostCapturedPhoto) => void;
  onClose: () => void;
};

export function PostCamera({ onCaptured, onClose }: PostCameraProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible
    >
      {/* Android modals live outside the app-level gesture root. */}
      <GestureHandlerRootView style={styles.screen}>
        {/* 의도: Modal 은 네이티브 계층이 분리돼 최상위 SafeAreaProvider 가 잰
            여백이 넘어오지 않는다. iOS에서 상단 닫기 버튼이 노치 밑으로 올라가
            눌리지 않았다. 라이브러리 안내대로 Modal 안에 Provider 를 다시 둔다.
            스토리 카메라는 Modal 이 아니라 이 처리가 필요 없다. */}
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <StatusBar style="light" />
          <CameraCaptureView
            enableZoom
            onCaptured={onCaptured}
            onClose={onClose}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.black,
    },
  });
