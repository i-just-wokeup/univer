import SignupForm from "./SignupForm";

// 회원가입 페이지도 searchParams 기반 에러 주입 방식으로 로그인 페이지와 맞춘다.
type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

// 실제 입력 UI와 상태 관리는 SignupForm이 담당한다.
export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <SignupForm
      initialError={typeof params.error === "string" ? params.error : null}
    />
  );
}
