import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

import { getSupabaseMobileClient } from "../../lib/supabase";

function createStoragePath(folder: string) {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${folder}/${id}.jpg`;
}

// React Native fetch가 일부 단말에서 file:// arrayBuffer를 못 읽을 때를 대비한 base64 폴백 디코더.
function decodeBase64(base64: string): ArrayBuffer {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const cleanBase64 = base64.replace(/[\r\n=]/g, "");
  const bytes: number[] = [];

  for (let index = 0; index < cleanBase64.length; index += 4) {
    const encoded1 = chars.indexOf(cleanBase64[index] ?? "A");
    const encoded2 = chars.indexOf(cleanBase64[index + 1] ?? "A");
    const encoded3 = chars.indexOf(cleanBase64[index + 2] ?? "A");
    const encoded4 = chars.indexOf(cleanBase64[index + 3] ?? "A");
    const bitmap =
      (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

    bytes.push((bitmap >> 16) & 255);

    if (index + 2 < cleanBase64.length) {
      bytes.push((bitmap >> 8) & 255);
    }

    if (index + 3 < cleanBase64.length) {
      bytes.push(bitmap & 255);
    }
  }

  return new Uint8Array(bytes).buffer;
}

async function getManipulatedImageBytes(
  uri: string,
  width: number,
): Promise<ArrayBuffer> {
  const manipulated = await manipulateAsync(uri, [{ resize: { width } }], {
    compress: 0.8,
    format: SaveFormat.JPEG,
  });

  try {
    const response = await fetch(manipulated.uri);
    return await response.arrayBuffer();
  } catch {
    const base64Manipulated = await manipulateAsync(
      uri,
      [{ resize: { width } }],
      { base64: true, compress: 0.8, format: SaveFormat.JPEG },
    );

    if (!base64Manipulated.base64) {
      throw new Error("이미지 압축 결과를 읽지 못했습니다.");
    }

    return decodeBase64(base64Manipulated.base64);
  }
}

// 로컬 이미지 URI들을 리사이즈/압축해 지정한 Storage 버킷에 올리고 공개 URL을 반환한다.
export async function uploadImagesToBucket(
  bucket: string,
  folder: string,
  uris: string[],
  width = 1600,
): Promise<string[]> {
  const supabase = getSupabaseMobileClient();

  return Promise.all(
    uris.map(async (uri) => {
      const bytes = await getManipulatedImageBytes(uri, width);
      const path = createStoragePath(folder);
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, bytes, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        throw new Error("이미지 업로드에 실패했습니다.");
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      return data.publicUrl;
    }),
  );
}
