import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getUserOnboardingStatus } from "@/features/auth/api";
import type { Database } from "@/types/database.types";

// 인증 진입점과 온보딩 단계는 미들웨어 리다이렉트를 건너뛴다.
function isExcludedPath(pathname: string) {
  return [
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/onboarding",
  ].includes(pathname);
}

// 외부 URL 주입을 막기 위해 내부 상대 경로만 redirectTo로 허용한다.
function getSafeRedirectPath(pathname: string, search: string) {
  const nextPath = `${pathname}${search}`;

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

// Supabase가 갱신한 쿠키를 redirect/next 응답에도 그대로 복사한다.
function copyCookiesToResponse(
  source: NextResponse,
  target: NextResponse,
) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
}

// 세션 쿠키를 유지한 채 로그인/온보딩 페이지로 이동시키는 헬퍼.
function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  redirectTo?: string,
) {
  const url = new URL(pathname, request.url);

  if (redirectTo) {
    url.searchParams.set("redirectTo", redirectTo);
  }

  return copyCookiesToResponse(response, NextResponse.redirect(url));
}

// 보호 라우트에서 로그인 여부와 온보딩 완료 여부를 순서대로 검사한다.
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });

  const pathname = request.nextUrl.pathname;

  if (isExcludedPath(pathname)) {
    // 제외 경로에서도 세션 갱신은 유지해 auth 쿠키를 최신 상태로 맞춘다.
    await supabase.auth.getUser();
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithCookies(
      request,
      response,
      "/auth/login",
      getSafeRedirectPath(pathname, request.nextUrl.search),
    );
  }

  try {
    // 로그인은 되었지만 프로필 입력이 끝나지 않은 유저는 온보딩으로 보낸다.
    const isOnboarded = await getUserOnboardingStatus(supabase, user.id);

    if (!isOnboarded) {
      return redirectWithCookies(request, response, "/onboarding");
    }
  } catch {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
