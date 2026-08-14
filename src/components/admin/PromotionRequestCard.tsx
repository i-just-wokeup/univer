"use client";

import type { AdminPromotionRequest } from "@/features/admin/api";
import { getRelativeTimeLabel } from "@/lib/utils/time";

type PromotionRequestCardProps = {
  isSelected: boolean;
  onSelect: () => void;
  request: AdminPromotionRequest;
};

const numberFormatter = new Intl.NumberFormat("ko-KR");

export function PromotionRequestCard({
  isSelected,
  onSelect,
  request,
}: PromotionRequestCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-3xl border p-5 text-left transition ${
        isSelected
          ? "border-zinc-950 bg-zinc-950 text-white shadow-lg"
          : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{request.nickname}</p>
          <p
            className={`mt-1 truncate text-sm ${
              isSelected ? "text-zinc-300" : "text-zinc-500"
            }`}
          >
            {request.department ?? "학과 미입력"}
          </p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium ${
            isSelected ? "text-zinc-400" : "text-zinc-400"
          }`}
        >
          {getRelativeTimeLabel(request.createdAt)}
        </span>
      </div>

      <div
        className={`mt-5 grid grid-cols-3 gap-2 border-t pt-4 ${
          isSelected ? "border-zinc-700" : "border-zinc-100"
        }`}
      >
        <Metric label="게시물" value={numberFormatter.format(request.postsCount)} />
        <Metric label="도달" value={numberFormatter.format(request.reach)} />
        <Metric label="참여율" value={`${request.engagementRate.toFixed(1)}%`} />
      </div>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs opacity-60">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
