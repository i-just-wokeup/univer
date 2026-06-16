"use client";

// 게시물/스토리 등 공개범위가 필요한 모든 작성 화면에서 재사용한다.
// DB 값은 public / close_friends 두 가지만 사용한다.
export type Visibility = "public" | "close_friends";

type VisibilityOption = {
  description: string;
  label: string;
  value: Visibility;
};

const visibilityOptions: VisibilityOption[] = [
  {
    description: "같은 학교 학생 모두에게 보입니다.",
    label: "전체공개",
    value: "public",
  },
  {
    description: "내 크루에게만 보입니다.",
    label: "크루공개",
    value: "close_friends",
  },
];

type VisibilityPickerProps = {
  // 다크 배경(스토리 작성 등)에서도 쓸 수 있도록 테마를 분기한다.
  theme?: "light" | "dark";
  value: Visibility;
  onChange: (value: Visibility) => void;
};

export function VisibilityPicker({
  theme = "light",
  value,
  onChange,
}: VisibilityPickerProps) {
  const isDark = theme === "dark";

  return (
    <section className="flex flex-col gap-3">
      <h2
        className={`text-sm font-extrabold ${
          isDark ? "text-white" : "text-foreground"
        }`}
      >
        공개 범위
      </h2>
      <div
        className={`grid grid-cols-2 gap-2 rounded-[20px] p-1 ${
          isDark ? "bg-zinc-800" : "bg-white/70 shadow-sm"
        }`}
      >
        {visibilityOptions.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex flex-col items-center gap-1 rounded-[16px] px-4 py-3 text-center transition ${
                isSelected
                  ? isDark
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "bg-krew-accent text-white shadow-[var(--krew-accent-glow)]"
                  : isDark
                    ? "text-zinc-400"
                    : "text-krew-muted hover:bg-white/70 hover:text-krew-accent"
              }`}
            >
              <span className="text-sm font-extrabold">{option.label}</span>
              <span
                className={`text-[11px] font-semibold ${
                  isSelected
                    ? isDark
                      ? "text-zinc-500"
                      : "text-white/80"
                    : isDark
                      ? "text-zinc-500"
                      : "text-krew-faint"
                }`}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
