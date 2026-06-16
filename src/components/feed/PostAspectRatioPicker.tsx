"use client";

import type { PostAspectRatio } from "@/features/feed/api";
import { POST_ASPECT_RATIO_OPTIONS } from "@/components/feed/postAspectRatio";

type PostAspectRatioPickerProps = {
  onChange: (value: PostAspectRatio) => void;
  value: PostAspectRatio;
};

export function PostAspectRatioPicker({
  onChange,
  value,
}: PostAspectRatioPickerProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-extrabold text-foreground">비율</h2>
        <p className="mt-1 text-xs font-semibold text-krew-muted">
          피드에 표시될 게시물 프레임을 선택하세요.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-[20px] bg-white/70 p-1 shadow-sm">
        {POST_ASPECT_RATIO_OPTIONS.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex min-h-14 flex-col items-center justify-center rounded-[16px] px-2 text-center transition ${
                isSelected
                  ? "bg-krew-accent text-white shadow-[var(--krew-accent-glow)]"
                  : "text-krew-muted hover:bg-white/70 hover:text-krew-accent"
              }`}
              aria-pressed={isSelected}
            >
              <span className="text-sm font-extrabold">{option.label}</span>
              <span
                className={`mt-0.5 text-xs font-semibold ${
                  isSelected ? "text-white/80" : "text-krew-faint"
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
