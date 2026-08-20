import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보 처리방침 · unip",
  description: "unip 개인정보 처리방침",
};

// 실제 서비스 데이터 처리에 맞춰 작성. 운영주체·연락처·보호책임자·시행일 확정 완료.
// 출시 전 법률 전문가 최종 검토 권장.
const UPDATED_AT = "2026-08-21";
const OPERATOR = "심재성";
const CONTACT_EMAIL = "unip.support@gmail.com";
const PRIVACY_OFFICER = "심재성";

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
      <div className="mt-3 space-y-2 text-sm leading-7 text-zinc-700">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-black text-zinc-950">개인정보 처리방침</h1>
      <p className="mt-2 text-sm text-zinc-500">최종 수정일: {UPDATED_AT}</p>

      <p className="mt-6 text-sm leading-7 text-zinc-700">
        {OPERATOR}(이하 &ldquo;서비스&rdquo;)는 「개인정보 보호법」 등 관련 법령을
        준수하며, 이용자의 개인정보를 안전하게 보호하기 위해 다음과 같이 개인정보
        처리방침을 수립·공개합니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <p>서비스는 다음의 개인정보를 수집합니다.</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <b>회원가입·본인확인</b>: 학교 구글 계정 이메일, 실명, 닉네임, 학과,
            프로필 사진, 소속 대학교
          </li>
          <li>
            <b>서비스 이용 중 생성</b>: 게시물·댓글·스토리·메시지(DM)의
            텍스트·사진·영상 콘텐츠, 좋아요·저장·팔로우/크루 내역, 신고·차단 내역
          </li>
          <li>
            <b>자동 수집</b>: 기기 푸시 알림 토큰, 접속 로그·기기/브라우저 정보,
            서비스 이용 기록(게시물·스토리 조회, 동영상 시청 구간·완주율, 피드
            노출 기록 등)
          </li>
        </ul>
      </Section>

      <Section title="2. 개인정보의 이용 목적">
        <ul className="ml-4 list-disc space-y-1">
          <li>실명 기반 대학 커뮤니티 서비스 제공 및 본인 확인(학교 계정 인증)</li>
          <li>게시물·댓글·메시지 등 콘텐츠 제공 및 알림 발송</li>
          <li>신고·차단 등 이용자 보호 및 부정 이용 방지</li>
          <li>
            서비스 이용 통계 분석 및 콘텐츠 성과 인사이트 제공(크리에이터·기관
            계정), 서비스 운영·개선 및 문의 응대
          </li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용기간, 파기">
        <p>
          이용자가 <b>회원 탈퇴</b>를 요청하면 즉시 서비스 이용을 중단(비활성)
          처리하며, <b>30일이 경과한 후 계정 및 관련 데이터(게시물·댓글·스토리·메시지·프로필
          등)를 영구적으로 삭제</b>합니다. 30일의 유예기간은 오조작에 의한 탈퇴로부터
          이용자를 보호하기 위한 기간입니다.
        </p>
        <p>
          단, 관계 법령에 따라 보존 의무가 있는 정보는 해당 법령이 정한 기간 동안
          보관 후 파기합니다.
        </p>
      </Section>

      <Section title="4. 개인정보 처리의 위탁 및 제3자 제공">
        <p>
          서비스는 원활한 제공을 위해 아래 사업자에게 개인정보 처리를 위탁하고
          있습니다. 위탁받은 사업자는 위탁 목적 범위 내에서만 개인정보를
          처리합니다.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Supabase — 데이터베이스, 인증, 파일 저장</li>
          <li>Cloudflare — 동영상 스트리밍/전송</li>
          <li>Vercel — 웹 서비스 호스팅</li>
          <li>Google — 학교 계정 로그인(OAuth) 인증</li>
          <li>
            Expo(EAS) · Firebase Cloud Messaging(Google, Android) · Apple Push
            Notification service(Apple, iOS) — 푸시 알림 전송
          </li>
          <li>Sentry — 오류·진단 로그 수집(앱·웹 안정성 개선)</li>
        </ul>
        <p>
          <b>개인정보의 국외 이전</b>: 위 수탁사 중
          Cloudflare·Vercel·Google·Apple·Expo·Sentry는 국외에 서버를 두고 있어,
          서비스 제공에 필요한 범위에서 개인정보가 국외로 이전되어 처리될 수
          있습니다. 이전되는 항목·목적·보유기간은 본 방침에
          기재된 바와 같습니다.
        </p>
        <p>
          법령에 근거하거나 이용자의 동의가 있는 경우를 제외하고는 개인정보를
          제3자에게 제공하지 않습니다.
        </p>
      </Section>

      <Section title="5. 이용자의 권리와 행사 방법">
        <p>
          이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지 및
          회원 탈퇴를 요구할 수 있습니다. 앱 내 <b>설정</b>에서 프로필 수정 및
          회원 탈퇴가 가능하며, 기타 요청은 아래 연락처로 문의할 수 있습니다.
        </p>
      </Section>

      <Section title="6. 개인정보 보호책임자">
        <ul className="ml-4 list-disc space-y-1">
          <li>개인정보 보호책임자: {PRIVACY_OFFICER}</li>
          <li>문의: {CONTACT_EMAIL}</li>
        </ul>
      </Section>

      <Section title="7. 고지 의무">
        <p>
          본 방침의 내용 추가·삭제 및 수정이 있을 경우 시행 최소 7일 전에 서비스
          내 공지를 통해 알립니다.
        </p>
      </Section>

      <div className="mt-12 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-sm">
        <Link href="/terms" className="font-semibold text-[#7c3aed]">
          이용약관 보기 →
        </Link>
        <Link href="/guidelines" className="font-semibold text-[#7c3aed]">
          커뮤니티 가이드라인 보기 →
        </Link>
      </div>
    </main>
  );
}
