// 영상 업로드 전 압축 공용 헬퍼. 실패해도 업로드 자체는 계속되도록 원본 URI로 폴백한다.
import { Video } from "react-native-compressor";

export async function compressVideoForUpload(uri: string): Promise<string> {
  try {
    return await Video.compress(uri, {
      compressionMethod: "auto",
    });
  } catch {
    return uri;
  }
}
