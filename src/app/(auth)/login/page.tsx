import { redirect } from "next/navigation";

// `/login` 진입을 실제 인증 라우트 `/auth/login`으로 맞춰주는 alias 페이지.
export default function LoginAliasPage() {
  redirect("/auth/login");
}
