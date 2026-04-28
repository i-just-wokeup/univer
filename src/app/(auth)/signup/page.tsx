import { redirect } from "next/navigation";

// `/signup` 진입을 실제 인증 라우트 `/auth/signup`으로 맞춰주는 alias 페이지.
export default function SignupAliasPage() {
  redirect("/auth/signup");
}
