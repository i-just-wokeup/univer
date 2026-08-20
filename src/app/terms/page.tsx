import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 · unip",
  description: "unip 이용약관",
};

// 실제 서비스에 맞춰 작성. 운영주체·시행일·관할 확정 완료.
// 출시 전 법률 전문가 최종 검토 권장.
const EFFECTIVE_AT = "2026-08-21";
const OPERATOR = "심재성";
const GOVERNING_COURT = "서울중앙지방법원";

function Article({
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

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-black text-zinc-950">이용약관</h1>
      <p className="mt-2 text-sm text-zinc-500">시행일: {EFFECTIVE_AT}</p>

      <Article title="제1조 (목적)">
        <p>
          본 약관은 {OPERATOR}(이하 &ldquo;서비스&rdquo;)가 제공하는 대학생 실명
          기반 커뮤니티 서비스 &ldquo;unip&rdquo;의 이용과 관련하여 서비스와
          이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </Article>

      <Article title="제2조 (정의)">
        <ul className="ml-4 list-disc space-y-1">
          <li>&ldquo;이용자&rdquo;란 본 약관에 따라 서비스를 이용하는 회원을 말합니다.</li>
          <li>
            &ldquo;게시물&rdquo;이란 이용자가 서비스에 게시한 글·사진·영상·댓글·스토리·메시지
            등 일체의 콘텐츠를 말합니다.
          </li>
          <li>
            &ldquo;크루&rdquo;란 이용자 간 상호 수락으로 형성되는 연결 관계를 말합니다.
          </li>
        </ul>
      </Article>

      <Article title="제3조 (이용계약의 체결)">
        <p>
          이용계약은 이용자가 <b>학교 구글 계정으로 본인 인증</b>을 거쳐 실명·닉네임·학과
          등 필수 정보를 입력하고 본 약관에 동의함으로써 체결됩니다. 서비스는
          실명 기반 커뮤니티로서, 타인의 명의를 도용하거나 허위 정보를 등록해서는
          안 됩니다.
        </p>
      </Article>

      <Article title="제4조 (이용자의 의무 및 금지행위)">
        <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>타인의 명의·정보를 도용하거나 사칭하는 행위</li>
          <li>허위 사실, 명예훼손, 모욕, 혐오·차별적 표현을 게시하는 행위</li>
          <li>음란물 등 불법·유해 정보를 게시하거나 유포하는 행위</li>
          <li>스팸, 광고, 반복적인 도배 등 서비스 운영을 방해하는 행위</li>
          <li>타인의 개인정보·저작권 등 권리를 침해하는 행위</li>
          <li>서비스의 정상적인 운영을 방해하거나 관련 법령을 위반하는 행위</li>
        </ul>
      </Article>

      <Article title="제5조 (게시물의 관리)">
        <p>
          이용자는 게시물을 신고하거나 특정 이용자를 차단할 수 있습니다. 서비스는
          제4조 및 서비스가 별도로 정한 <b>커뮤니티 가이드라인</b>을 위반하거나 관련
          법령·본 약관에 위배되는 게시물에 대해 사전 통지 없이 삭제·숨김 등 조치를 할
          수 있습니다.
        </p>
      </Article>

      <Article title="제6조 (콘텐츠 정책 및 이용자 행동 규범)">
        <p>
          이용자는 타인을 위협·괴롭히거나 음란물·불법 촬영물 등 부적절하거나
          불쾌감을 주는 콘텐츠를 게시할 수 없습니다. 서비스는 이러한 콘텐츠와
          행위에 무관용 원칙을 적용합니다.
        </p>
        <p>
          위반 콘텐츠 및 이용자는 앱 내 신고 기능으로 신고할 수 있으며, 서비스는
          신고 접수 후 24시간 이내에 검토하고 필요한 조치를 진행합니다.
        </p>
        <p>
          위반이 확인되면 해당 콘텐츠 삭제, 이용자 차단 또는 서비스 이용 정지 등의
          조치가 이루어질 수 있습니다.
        </p>
        <p>
          콘텐츠 관련 문의·신고:{" "}
          <a
            href="mailto:unip.support@gmail.com"
            className="font-semibold underline underline-offset-2"
          >
            unip.support@gmail.com
          </a>
        </p>
      </Article>

      <Article title="제7조 (서비스의 제공 및 변경·중단)">
        <p>
          서비스는 연중무휴 제공을 원칙으로 하나, 시스템 점검·장애·불가항력 등의
          사유로 일시 중단될 수 있습니다. 서비스는 내용의 전부 또는 일부를 변경하거나
          중단할 수 있으며, 중대한 변경 시 사전에 공지합니다.
        </p>
      </Article>

      <Article title="제8조 (회원 탈퇴 및 이용 제한)">
        <p>
          이용자는 언제든지 앱 내 <b>설정 &gt; 회원 탈퇴</b>를 통해 이용계약을 해지할
          수 있습니다. 탈퇴 시 즉시 서비스 이용이 중단되며, <b>30일이 경과한 후 계정 및
          관련 데이터가 영구적으로 삭제</b>됩니다. 서비스는 이용자가 본 약관을 위반한
          경우 이용을 제한하거나 계약을 해지할 수 있습니다.
        </p>
      </Article>

      <Article title="제9조 (면책조항)">
        <p>
          서비스는 이용자가 게시한 게시물의 신뢰성·정확성에 대해 책임을 지지 않으며,
          이용자 간 또는 이용자와 제3자 간에 발생한 분쟁에 대해 개입할 의무가 없고
          이로 인한 손해를 배상할 책임을 지지 않습니다. 단, 서비스의 고의 또는 중대한
          과실로 인한 경우는 예외로 합니다.
        </p>
      </Article>

      <Article title="제10조 (준거법 및 관할)">
        <p>
          본 약관은 대한민국 법령에 따라 규율되며, 서비스와 이용자 간 분쟁에 관한
          소송은 {GOVERNING_COURT}을 관할 법원으로 합니다.
        </p>
      </Article>

      <div className="mt-12 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-sm">
        <Link href="/privacy" className="font-semibold text-[#7c3aed]">
          개인정보 처리방침 보기 →
        </Link>
        <Link href="/guidelines" className="font-semibold text-[#7c3aed]">
          커뮤니티 가이드라인 보기 →
        </Link>
      </div>
    </main>
  );
}
