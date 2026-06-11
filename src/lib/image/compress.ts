// 업로드 종류별로 다른 압축 강도를 주입받기 위한 옵션.
export type ImageCompressionOptions = {
  initialQuality: number;
  maxSizeMB: number;
  maxWidthOrHeight: number;
};

// 움짤/비이미지 등 압축하면 안 되는 파일은 원본을 그대로 둔다.
function shouldSkipCompression(file: File): boolean {
  if (!file.type.startsWith("image/")) {
    return true;
  }

  // GIF는 압축 시 애니메이션이 깨지므로 원본을 유지한다.
  if (file.type === "image/gif") {
    return true;
  }

  return false;
}

// 업로드 전에 브라우저에서 이미지를 압축한다.
// 압축 대상이 아니거나 실패하면 원본 파일을 그대로 반환해 업로드가 끊기지 않게 한다.
export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions,
): Promise<File> {
  if (shouldSkipCompression(file)) {
    return file;
  }

  try {
    const { default: imageCompression } = await import(
      "browser-image-compression"
    );
    const compressed = await imageCompression(file, {
      initialQuality: options.initialQuality,
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: true,
    });

    // 드물게 압축본이 더 큰 경우 원본을 사용한다.
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  }
}
