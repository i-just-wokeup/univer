// 영상 업로드 전 처리 공용 진입점.
//
// 클라이언트 압축(react-native-compressor)은 이 스택(RN 0.81 + New Architecture +
// 삼성 MediaCodec)에서 "Invalid to call at Released state"로 매번 실패해 폐기했다.
// 지금은 원본을 그대로 업로드한다(재생 OOM은 플레이어 bufferOptions로 방어됨).
// 실제 압축은 출시 준비 때 서버 트랜스코딩(Cloudflare Stream)으로 붙일 예정 —
// 그때 이 함수 안에서 처리하도록 단일 진입점으로 남겨둔다.
export async function compressVideoForUpload(uri: string): Promise<string> {
  return uri;
}
