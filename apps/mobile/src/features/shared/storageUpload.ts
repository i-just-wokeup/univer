// 큰 로컬 파일을 JS 메모리에 통째로 올리지 않고 Supabase Storage에 업로드한다.
// 영상처럼 수십 MB가 될 수 있는 파일은 supabase-js ArrayBuffer 업로드 대신 native upload를 사용한다.
import * as FileSystem from "expo-file-system/legacy";

import { getSupabaseMobileClient } from "../../lib/supabase";

type UploadFileUriToBucketParams = {
  bucket: string;
  cacheControl?: string;
  contentType: string;
  extension: string;
  folder: string;
  uri: string;
  upsert?: boolean;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function createStoragePath(folder: string, extension: string) {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${folder}/${id}.${extension}`;
}

function getStorageUploadUrl(bucket: string, path: string) {
  if (!supabaseUrl) {
    throw new Error("Expo Supabase 환경변수가 설정되지 않았습니다.");
  }

  return `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
}

function getStorageUploadErrorMessage(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: string; message?: string };
    return parsed.message ?? parsed.error ?? body;
  } catch {
    return body;
  }
}

// 로컬 file:// URI를 Supabase Storage에 binary body로 업로드하고 공개 URL을 반환한다.
export async function uploadFileUriToBucket({
  bucket,
  cacheControl = "3600",
  contentType,
  extension,
  folder,
  uri,
  upsert = false,
}: UploadFileUriToBucketParams): Promise<string> {
  if (!supabaseAnonKey) {
    throw new Error("Expo Supabase 환경변수가 설정되지 않았습니다.");
  }

  const supabase = getSupabaseMobileClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("로그인이 필요합니다.");
  }

  const path = createStoragePath(folder, extension);
  const uploadUrl = getStorageUploadUrl(bucket, path);
  const result = await FileSystem.uploadAsync(uploadUrl, uri, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": contentType,
      apikey: supabaseAnonKey,
      "cache-control": `max-age=${cacheControl}`,
      "x-upsert": String(upsert),
    },
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  if (result.status < 200 || result.status >= 300) {
    const message = getStorageUploadErrorMessage(result.body);
    throw new Error(message || "파일 업로드에 실패했습니다.");
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  if (!data.publicUrl) {
    throw new Error("파일 URL을 만들지 못했습니다.");
  }

  return data.publicUrl;
}
