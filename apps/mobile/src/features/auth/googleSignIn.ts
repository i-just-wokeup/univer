import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { getSupabaseMobileClient } from "../../lib/supabase";

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

GoogleSignin.configure({
  hostedDomain: "kookmin.ac.kr",
  webClientId: googleWebClientId,
});

export async function signInWithGoogle(): Promise<{ cancelled: boolean }> {
  if (!googleWebClientId) {
    throw new Error("Google 로그인 환경변수가 설정되지 않았습니다.");
  }

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result)) {
    return { cancelled: true };
  }

  const idToken = result.data.idToken;
  if (!idToken) {
    throw new Error("구글 로그인 토큰을 받지 못했습니다.");
  }

  const { error } = await getSupabaseMobileClient().auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });

  if (error) {
    throw error;
  }

  return { cancelled: false };
}
