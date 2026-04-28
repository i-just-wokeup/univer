import { NextResponse } from "next/server";
import { getUserOnboardingStatus } from "@/features/auth/api";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// redirectTo와 같은 외부 경로 주입을 막기 위한 내부 경로 정제 함수.
function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

// 인증 콜백에서 code를 세션으로 교환하고, 온보딩 여부에 따라 목적지를 나눈다.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const loginUrl = new URL("/auth/login", requestUrl.origin);

  // code가 없으면 정상적인 인증 콜백이 아니므로 로그인으로 되돌린다.
  if (!code) {
    loginUrl.searchParams.set("error", "인증 링크가 올바르지 않습니다.");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await getSupabaseServerClient();

  // 서버용 Supabase 클라이언트를 만들 수 없는 경우도 로그인 화면으로 복귀시킨다.
  if (!supabase) {
    loginUrl.searchParams.set("error", "Supabase 환경변수가 설정되지 않았습니다.");
    return NextResponse.redirect(loginUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // 세션 교환 실패는 로그인 에러로 통일한다.
  if (error) {
    loginUrl.searchParams.set(
      "error",
      "로그인 처리에 실패했습니다. 다시 시도해주세요.",
    );
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    loginUrl.searchParams.set("error", "로그인 정보를 확인할 수 없습니다.");
    return NextResponse.redirect(loginUrl);
  }

  // 신규 유저는 온보딩, 완료 유저는 원래 목적지 또는 홈으로 이동한다.
  const isOnboarded = await getUserOnboardingStatus(supabase, user.id);
  const redirectPath = isOnboarded ? nextPath : "/onboarding";

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
