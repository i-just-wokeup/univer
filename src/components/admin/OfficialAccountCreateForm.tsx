"use client";

import { Copy, KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";

import type {
  CreateOfficialAccountInput,
  CreatedOfficialAccount,
  OfficialAccountType,
} from "@/features/admin/officialAccountsApi";

type OfficialAccountCreateFormProps = {
  createdAccount: CreatedOfficialAccount | null;
  createdEmail: string | null;
  isSubmitting: boolean;
  onCopyPassword: () => void;
  onSubmit: (input: CreateOfficialAccountInput) => Promise<void>;
};

const ACCOUNT_TYPES: Array<{
  description: string;
  label: string;
  value: OfficialAccountType;
}> = [
  {
    description: "학생회·학회 등 학교 대표 조직",
    label: "학생회",
    value: "official",
  },
  {
    description: "교내 중앙·단과대·학과 동아리",
    label: "동아리",
    value: "club",
  },
];

export function OfficialAccountCreateForm({
  createdAccount,
  createdEmail,
  isSubmitting,
  onCopyPassword,
  onSubmit,
}: OfficialAccountCreateFormProps) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [orgName, setOrgName] = useState("");
  const [type, setType] = useState<OfficialAccountType>("official");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      email: email.trim(),
      nickname: nickname.trim(),
      orgName: orgName.trim(),
      type,
    });
  }

  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">공식 계정 생성</h2>
        <p className="mt-1 text-sm text-zinc-500">
          단체 로그인 계정과 최초 접속용 임시 비밀번호를 발급합니다.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="이메일"
            type="email"
            value={email}
            placeholder="council@kookmin.ac.kr"
            onChange={setEmail}
          />
          <FormField
            label="단체명"
            value={orgName}
            placeholder="국민대학교 총학생회"
            onChange={setOrgName}
          />
          <FormField
            label="닉네임"
            value={nickname}
            placeholder="kmu_council"
            onChange={setNickname}
          />

          <fieldset>
            <legend className="text-sm font-semibold text-zinc-800">유형</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((accountType) => (
                <label
                  key={accountType.value}
                  className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
                    type === accountType.value
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="official-account-type"
                    value={accountType.value}
                    checked={type === accountType.value}
                    onChange={() => setType(accountType.value)}
                  />
                  <span className="block text-sm font-semibold">{accountType.label}</span>
                  <span
                    className={`mt-1 block text-xs ${
                      type === accountType.value ? "text-zinc-300" : "text-zinc-400"
                    }`}
                  >
                    {accountType.description}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "생성 중..." : "계정 생성"}
        </button>
      </form>

      {createdAccount && createdEmail ? (
        <div className="mt-6 rounded-2xl bg-zinc-100 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <KeyRound className="h-4 w-4" />@{createdAccount.nickname} 생성됨
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-xl bg-white px-4 py-3 text-lg font-bold text-zinc-950">
              {createdAccount.tempPassword}
            </code>
            <button
              type="button"
              onClick={onCopyPassword}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              <Copy className="h-4 w-4" />
              복사
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            이 비번을 {createdEmail}에 전달하세요. 단체는 로그인 후 설정에서 변경합니다.
          </p>
        </div>
      ) : null}
    </section>
  );
}

type FormFieldProps = {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "email" | "text";
  value: string;
};

function FormField({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: FormFieldProps) {
  return (
    <label>
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
      />
    </label>
  );
}
