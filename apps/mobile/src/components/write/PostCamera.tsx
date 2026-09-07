import { StatusBar } from "expo-status-bar";
import { Modal, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
        <StatusBar style="light" />
        <CameraCaptureView
          enableZoom
          onCaptured={onCaptured}
          onClose={onClose}
        />
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
