import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Images } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import type { StoryCaptureMedia } from "../../features/stories/useStoryCreate";
import { colors, fontSize, fontWeight } from "../../lib/theme";
import { CameraCaptureView } from "../camera/CameraCaptureView";

type StoryCameraProps = {
  onClose: () => void;
  onSelected: (media: StoryCaptureMedia) => void;
};

const STORY_ASPECT_RATIO = 9 / 16;

async function cropCapturedPhotoToStory(uri: string) {
  const decodedImage = await ImageManipulator.manipulate(uri).renderAsync();
  let portraitImage = decodedImage;

  // 기본 EXIF 보정 뒤에도 가로 픽셀이 남는 기기는 세로로 정규화한다.
  if (decodedImage.width > decodedImage.height) {
    const rotation = ImageManipulator.manipulate(decodedImage);
    rotation.rotate(90);
    portraitImage = await rotation.renderAsync();
  }

  const sourceRatio = portraitImage.width / portraitImage.height;
  const cropHeight =
    sourceRatio > STORY_ASPECT_RATIO
      ? portraitImage.height - (portraitImage.height % 16)
      : ((portraitImage.width - (portraitImage.width % 9)) * 16) / 9;
  const cropWidth = (cropHeight * 9) / 16;
  const crop = ImageManipulator.manipulate(portraitImage);

  crop.crop({
    originX: Math.floor((portraitImage.width - cropWidth) / 2),
    originY: Math.floor((portraitImage.height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  });

  const croppedImage = await crop.renderAsync();
  return croppedImage.saveAsync({ compress: 1, format: SaveFormat.JPEG });
}

// 스토리용 카메라/갤러리 입력. 촬영하거나 고른 사진 uri를 onSelected로 넘긴다.
export function StoryCamera({ onClose, onSelected }: StoryCameraProps) {
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCapturedPhoto(photo: {
    height: number;
    uri: string;
    width: number;
  }) {
    const croppedPhoto = await cropCapturedPhotoToStory(photo.uri);
    onSelected({
      durationSeconds: null,
      kind: "image",
      uri: croppedPhoto.uri,
    });
  }

  async function handlePickImage() {
    setErrorMessage("");

    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!mediaPermission.granted) {
      setErrorMessage("사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images", "videos"],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const isVideo = asset.type === "video";

    onSelected({
      // asset.duration은 밀리초 → 초로.
      durationSeconds:
        isVideo && asset.duration ? Math.round(asset.duration / 1000) : null,
      kind: isVideo ? "video" : "image",
      uri: asset.uri,
    });
  }

  const galleryButton = (
    <Pressable
      accessibilityLabel="갤러리에서 선택"
      accessibilityRole="button"
      onPress={() => {
        void handlePickImage();
      }}
      style={styles.sideButton}
    >
      <Images color={colors.white} size={28} strokeWidth={2.2} />
    </Pressable>
  );

  const permissionGalleryButton = (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void handlePickImage();
      }}
    >
      <Text style={styles.permissionAltText}>갤러리에서 선택</Text>
    </Pressable>
  );

  return (
    <CameraCaptureView
      bottomLeftSlot={galleryButton}
      enableZoom
      errorMessage={errorMessage}
      onCaptured={handleCapturedPhoto}
      onClose={onClose}
      permissionAlternativeSlot={permissionGalleryButton}
    />
  );
}

const styles = StyleSheet.create({
  sideButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.scrimWeak,
  },
  permissionAltText: {
    color: colors.white,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
});
