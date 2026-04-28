import LoginForm from "./LoginForm";

// 로그인 페이지는 URL 쿼리의 에러 문자열만 읽어서 폼에 전달한다.
type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

// Server Component에서 searchParams를 해석하고 실제 UI는 클라이언트 폼에 맡긴다.
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <LoginForm
      initialError={typeof params.error === "string" ? params.error : null}
    />
  );
}
