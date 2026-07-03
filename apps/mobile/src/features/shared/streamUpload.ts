import * as FileSystem from "expo-file-system/legacy";

import { getSupabaseMobileClient } from "../../lib/supabase";

const CLOUDFLARE_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const PROGRESS_LOG_STEP = 10;

// 개발 빌드에서만 콘솔에 찍는다(프로덕션엔 파일크기/asset id 등 노이즈·정보 노출 방지).
function logDev(...args: unknown[]) {
  if (__DEV__) {
    console.log(...args);
  }
}

function warnDev(...args: unknown[]) {
  if (__DEV__) {
    console.warn(...args);
  }
}

export type CloudflareStreamUploadResult = {
  assetId: string;
  playbackUrl: string;
  provider: "cloudflare_stream";
  status: "processing";
  thumbnailUrl: string;
};

type StreamUploadUrlResponse = {
  playbackUrl: string;
  provider: "cloudflare_stream";
  status: "processing";
  thumbnailUrl: string;
  uid: string;
  uploadURL: string;
};

type ReactNativeFormDataFile = {
  name: string;
  type: string;
  uri: string;
};

function isStreamUploadUrlResponse(
  value: unknown,
): value is StreamUploadUrlResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<StreamUploadUrlResponse>;
  return (
    typeof response.playbackUrl === "string" &&
    response.provider === "cloudflare_stream" &&
    response.status === "processing" &&
    typeof response.thumbnailUrl === "string" &&
    typeof response.uid === "string" &&
    typeof response.uploadURL === "string"
  );
}

function getCloudflareUploadErrorMessage(body: string) {
  try {
    const parsed = JSON.parse(body) as {
      errors?: Array<{ message?: string }>;
      message?: string;
    };
    return parsed.errors?.[0]?.message ?? parsed.message ?? body;
  } catch {
    return body;
  }
}

function getUploadFileName(uri: string) {
  const [path] = uri.split("?");
  const fileName = path.split("/").pop();

  if (!fileName) {
    return "video.mp4";
  }

  return fileName.toLowerCase().endsWith(".mp4") ? fileName : `${fileName}.mp4`;
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

async function logFileInfo(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);

    if (info.exists) {
      logDev("[stream-upload] local file", {
        size: formatBytes(info.size),
        uriPrefix: uri.slice(0, 48),
      });
    } else {
      warnDev("[stream-upload] local file not found", {
        uriPrefix: uri.slice(0, 48),
      });
    }
  } catch (error) {
    warnDev("[stream-upload] failed to inspect local file", {
      error,
      uriPrefix: uri.slice(0, 48),
    });
  }
}

function uploadMultipartToCloudflare(uploadUrl: string, uri: string) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastLoggedProgress = -1;

    xhr.timeout = CLOUDFLARE_UPLOAD_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) {
        return;
      }

      // 멀티파트 오버헤드로 loaded가 total을 넘을 수 있어 100%로 clamp.
      const progress = Math.min(100, Math.floor((event.loaded / event.total) * 100));
      const progressBucket =
        Math.floor(progress / PROGRESS_LOG_STEP) * PROGRESS_LOG_STEP;

      if (progressBucket !== lastLoggedProgress) {
        lastLoggedProgress = progressBucket;
        logDev("[stream-upload] upload progress", {
          loaded: formatBytes(event.loaded),
          progress: `${progress}%`,
          total: formatBytes(event.total),
        });
      }
    };

    xhr.onload = () => {
      const body = xhr.responseText ?? "";

      logDev("[stream-upload] upload finished", {
        status: xhr.status,
      });

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(
        new Error(
          getCloudflareUploadErrorMessage(body) ||
            "Cloudflare 영상 업로드에 실패했습니다.",
        ),
      );
    };

    xhr.onerror = () => {
      reject(new Error("Cloudflare 영상 업로드 네트워크 요청에 실패했습니다."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Cloudflare 영상 업로드 시간이 초과되었습니다."));
    };

    const formData = new FormData();
    const file: ReactNativeFormDataFile = {
      name: getUploadFileName(uri),
      type: "video/mp4",
      uri,
    };

    formData.append("file", file as unknown as Blob);

    logDev("[stream-upload] upload started", {
      timeoutMs: CLOUDFLARE_UPLOAD_TIMEOUT_MS,
    });

    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
}

export async function uploadVideoToCloudflareStream(
  uri: string,
): Promise<CloudflareStreamUploadResult> {
  const supabase = getSupabaseMobileClient();

  await logFileInfo(uri);

  logDev("[stream-upload] requesting upload url");
  const { data, error } = await supabase.functions.invoke("stream-upload-url", {
    method: "POST",
  });

  if (error || !isStreamUploadUrlResponse(data)) {
    throw new Error(error?.message ?? "Cloudflare 업로드 URL을 받지 못했습니다.");
  }

  logDev("[stream-upload] upload url received", {
    assetId: data.uid,
  });

  await uploadMultipartToCloudflare(data.uploadURL, uri);

  return {
    assetId: data.uid,
    playbackUrl: data.playbackUrl,
    provider: data.provider,
    status: data.status,
    thumbnailUrl: data.thumbnailUrl,
  };
}
