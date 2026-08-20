import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "고객지원 · unip",
  description: "unip 고객지원 및 자주 묻는 질문",
};

const SUPPORT_EMAIL = "unip.support@gmail.com";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-5 text-sm leading-7 text-zinc-700">
        {children}
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    question: "로그인이 되지 않아요",
    answer:
      "학교 이메일(@kookmin.ac.kr) 구글 계정으로 로그인하거나 가입해 주세요.",
  },
  {
    question: "계정을 삭제하고 싶어요",
    answer: (
      <>
        앱 내 <b>설정 &gt; 회원 탈퇴</b>를 이용하거나{" "}
        <Link
          href="/delete-account"
          className="font-semibold underline underline-offset-2"
        >
          웹 계정 삭제 페이지
        </Link>
        에서 요청해 주세요.
      </>
    ),
  },
  {
    question: "부적절한 게시물·사용자를 신고하려면",
    answer:
      "해당 게시물 또는 프로필의 신고·차단 기능을 이용해 주세요.",
  },
  {
    question: "비밀번호를 잊었어요",
    answer: "로그인 화면의 비밀번호 재설정을 이용해 주세요.",
  },
] satisfies ReadonlyArray<{
  question: string;
  answer: React.ReactNode;
}>;

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-black text-zinc-950">unip 고객지원</h1>
      <p className="mt-6 text-sm leading-7 text-zinc-700">
        문의사항은 아래 이메일로 연락해 주세요.
      </p>

      <a
        href={"mailto:" + SUPPORT_EMAIL}
        className="mt-3 inline-block text-sm font-semibold text-[#7c3aed] underline underline-offset-2"
      >
        {SUPPORT_EMAIL}
      </a>

      <Section title="자주 묻는 질문">
        <dl className="space-y-5">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <dt className="font-bold text-zinc-900">{item.question}</dt>
              <dd className="mt-1">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <nav
        aria-label="관련 정책"
        className="mt-12 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-sm"
      >
        <Link href="/terms" className="font-semibold text-[#7c3aed]">
          이용약관 보기 →
        </Link>
        <Link href="/privacy" className="font-semibold text-[#7c3aed]">
          개인정보 처리방침 보기 →
        </Link>
        <Link href="/delete-account" className="font-semibold text-[#7c3aed]">
          계정 삭제 →
        </Link>
      </nav>
    </main>
  );
}
