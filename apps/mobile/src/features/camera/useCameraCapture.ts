import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useMemo, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";

export type CapturedPhoto = {
  height: number;
  uri: string;
  width: number;
};

type UseCameraCaptureOptions = {
  enableZoom: boolean;
  onCaptured: (photo: CapturedPhoto) => void | Promise<void>;
  onClose: () => void;
};

const CAMERA_ZOOM_SENSITIVITY = 0.25;
const CAMERA_ALBUM_NAME = "unip";

function clampCameraZoom(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getCaptureErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "사진을 촬영하지 못했습니다.";
}

async function saveCapturedPhotoToAlbum(uri: string): Promise<void> {
  let album: MediaLibrary.Album | null;
  try {
    album = await MediaLibrary.getAlbumAsync(CAMERA_ALBUM_NAME);
  } catch {
    await MediaLibrary.createAssetAsync(uri);
    return;
  }

  if (album) {
    await MediaLibrary.createAssetAsync(uri, album);
    return;
  }

  try {
    await MediaLibrary.createAlbumAsync(
      CAMERA_ALBUM_NAME,
      undefined,
      true,
      uri,
    );
  } catch {
    await MediaLibrary.createAssetAsync(uri);
  }
}

async function saveCapturedPhoto(uri: string): Promise<void> {
  try {
    let permission = await MediaLibrary.getPermissionsAsync(true, ["photo"]);
    if (!permission.granted) {
      permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
    }
    if (permission.granted) {
      await saveCapturedPhotoToAlbum(uri);
    }
  } catch {
    // Gallery saving is best-effort and must not block the captured photo flow.
  }
}

export function useCameraCapture({
  enableZoom,
  onCaptured,
  onClose,
}: UseCameraCaptureOptions) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [zoom, setZoom] = useState(0);
  const zoomRef = useRef(0);
  const pinchStartZoomRef = useRef(0);

  function resetZoom() {
    setZoom(0);
    zoomRef.current = 0;
    pinchStartZoomRef.current = 0;
  }

  // Gesture callbacks run after render; the hooks lint cannot infer that contract.
  /* eslint-disable react-hooks/refs */
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(enableZoom && isCameraReady && !isCapturing)
        .runOnJS(true)
        .onStart(() => {
          pinchStartZoomRef.current = zoomRef.current;
        })
        .onUpdate((event) => {
          const zoomDelta =
            (Math.log(event.scale) / Math.LN2) * CAMERA_ZOOM_SENSITIVITY;
          const nextZoom = clampCameraZoom(
            pinchStartZoomRef.current + zoomDelta,
          );
          zoomRef.current = nextZoom;
          setZoom(nextZoom);
        }),
    [enableZoom, isCameraReady, isCapturing],
  );
  /* eslint-enable react-hooks/refs */

  async function capture() {
    if (!isCameraReady || isCapturing) {
      return;
    }

    setErrorMessage("");
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        shutterSound: false,
      });
      if (!photo?.uri || photo.width <= 0 || photo.height <= 0) {
        throw new Error("촬영 결과를 불러오지 못했습니다.");
      }
      await saveCapturedPhoto(photo.uri);
      await onCaptured({
        height: photo.height,
        uri: photo.uri,
        width: photo.width,
      });
    } catch (error) {
      setErrorMessage(getCaptureErrorMessage(error));
    } finally {
      setIsCapturing(false);
    }
  }

  function close() {
    resetZoom();
    onClose();
  }

  function switchCamera() {
    if (isCapturing) {
      return;
    }
    setIsCameraReady(false);
    setFlash("off");
    resetZoom();
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  function toggleFlash() {
    setFlash((current) => (current === "off" ? "on" : "off"));
  }

  return {
    cameraRef,
    capture,
    close,
    errorMessage,
    facing,
    flash,
    isCameraReady,
    isCapturing,
    permission,
    pinchGesture,
    requestPermission,
    setErrorMessage,
    setIsCameraReady,
    switchCamera,
    toggleFlash,
    zoom,
  };
}
