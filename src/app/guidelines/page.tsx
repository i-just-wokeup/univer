import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "커뮤니티 가이드라인 · unip",
  description: "unip 커뮤니티 가이드라인",
};

// 신고·제재 운영의 기준 문서. Google Play 아동 안전 표준(CSAE) 공개 문서를 겸한다.
const CONTACT_EMAIL = "unip.support@gmail.com";

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8" id={id}>
      <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-7 text-zinc-700">
        {children}
      </div>
    </section>
  );
}

export default function GuidelinesPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-black text-zinc-950">커뮤니티 가이드라인</h1>
      <p className="mt-6 text-sm leading-7 text-zinc-700">
        unip는 대학생이 실명으로 안전하게 소통하는 커뮤니티입니다. 모두가
        존중받는 공간을 위해 아래 가이드라인을 지켜주세요. 본 가이드라인은
        이용약관의 일부로서, 위반 시 게시물 삭제·숨김 및 이용 제한의 근거가 됩니다.
      </p>

      <Section title="1. 금지되는 행위·콘텐츠">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <b>사칭·명의도용</b>: 타인의 이름·사진·신분을 도용하거나 사칭하는 행위
          </li>
          <li>
            <b>괴롭힘·따돌림·협박</b>: 특정인을 겨냥한 지속적 괴롭힘, 위협, 스토킹
          </li>
          <li>
            <b>혐오·차별</b>: 성별·지역·출신·장애·인종·종교·성적 지향 등에 대한
            혐오 표현 및 차별·비하
          </li>
          <li>
            <b>성적·음란 콘텐츠</b>: 음란물, 성적 수치심을 유발하는 콘텐츠,
            불법 촬영물, 아동·청소년 관련 성적 콘텐츠
          </li>
          <li>
            <b>폭력·자해</b>: 폭력을 조장·미화하거나 자살·자해를 부추기는 콘텐츠
          </li>
          <li>
            <b>불법 정보</b>: 마약·도박·불법 거래·사기 등 법령을 위반하는 정보
          </li>
          <li>
            <b>개인정보 무단 게시</b>: 동의 없는 타인의 연락처·주소·신상 등 노출
            (이른바 &ldquo;신상털기&rdquo;)
          </li>
          <li>
            <b>스팸·도배·광고</b>: 반복 게시, 무단 홍보·광고, 자동화 도배
          </li>
          <li>
            <b>권리 침해</b>: 저작권·초상권 등 타인의 권리를 침해하는 콘텐츠
          </li>
          <li>
            <b>허위·기만</b>: 허위 사실 유포, 명예훼손, 기만적 행위
          </li>
        </ul>
      </Section>

      <Section title="2. 신고·차단">
        <p>
          가이드라인을 위반하는 게시물·댓글·스토리·프로필은 각 항목의 <b>⋯ 메뉴 &gt;
          신고</b>로 신고할 수 있습니다. 원치 않는 이용자는 <b>차단</b>하여 서로의
          콘텐츠와 메시지를 보이지 않게 할 수 있습니다.
        </p>
      </Section>

      <Section title="3. 신고 처리 및 제재">
        <p>
          접수된 신고는 운영자가 확인 후 조치합니다. 위반 정도에 따라 다음 조치가
          이루어질 수 있습니다.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>게시물 삭제·숨김 처리</li>
          <li>반복·중대 위반 시 이용 제한 또는 계정 영구 정지</li>
          <li>
            불법 행위로 판단되는 경우 관련 법령에 따라 수사기관 등에 협조
          </li>
        </ul>
        <p>
          긴급하거나 명백한 위반(불법 촬영물, 아동 관련 성적 콘텐츠 등)은 신속히
          처리하며, 필요 시 사전 통지 없이 조치할 수 있습니다.
        </p>
      </Section>

      <Section id="child-safety" title="4. 아동 안전 표준 (Child Safety Standards)">
        <p>
          unip는 아동 성적 학대 및 착취(CSAE)에 무관용 원칙을 적용하며, 관련
          콘텐츠와 행위를 전면 금지합니다.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <b>이용 대상</b>: unip는 대학교에서 발급한 학교 계정(@kookmin.ac.kr)으로만
            가입할 수 있는 대학생 전용 서비스이며, 이용 대상 연령은 만 18세
            이상입니다. 익명 채팅이나 무작위 상대 매칭은 제공하지 않습니다.
          </li>
          <li>
            <b>전면 금지</b>: 아동·청소년 성착취물(CSAM), 아동을 성적으로 묘사하거나
            대상화하는 콘텐츠, 아동에 대한 그루밍·유인 행위를 금지합니다.
          </li>
          <li>
            <b>신고 방법</b>: 게시물·댓글·스토리·프로필의 <b>⋯ 메뉴 &gt; 신고</b>를 통해
            앱 안에서 누구나 즉시 신고할 수 있습니다.
          </li>
          <li>
            <b>조치</b>: 위반을 인지한 즉시 해당 콘텐츠를 삭제하고 계정을 영구
            정지하며, 접수된 신고는 24시간 이내에 검토합니다.
          </li>
          <li>
            <b>기관 신고</b>: 확인된 아동 성착취물은 관련 법령에 따라 대한민국
            수사기관(경찰청) 등 관할 기관에 신고하며, 필요한 경우 국제
            실종학대아동방지센터(NCMEC)를 포함한 기관에 신고하고 조사에 협조합니다.
          </li>
          <li>
            <b>담당 연락처</b>: 아동 안전 관련 문의와 통지는 {CONTACT_EMAIL}로
            접수하며, 담당자가 신고 처리 및 검토 절차에 대해 응답합니다.
          </li>
        </ul>
      </Section>

      <Section title="5. 문의">
        <p>
          가이드라인·신고 처리에 대한 문의는 {CONTACT_EMAIL}로 연락해 주세요.
        </p>
      </Section>

      <div className="mt-12 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-sm">
        <Link href="/terms" className="font-semibold text-[#7c3aed]">
          이용약관 보기 →
        </Link>
        <Link href="/privacy" className="font-semibold text-[#7c3aed]">
          개인정보 처리방침 보기 →
        </Link>
      </div>
    </main>
  );
}
