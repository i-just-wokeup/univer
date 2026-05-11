"use client";

import { useEffect } from "react";

type ToastType = "success" | "error";

type ToastProps = {
  isVisible: boolean;
  message: string;
  onHide: () => void;
  type?: ToastType;
};

export function Toast({
  isVisible,
  message,
  onHide,
  type = "success",
}: ToastProps) {
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const unmountTimer = window.setTimeout(() => {
      onHide();
    }, 3000);

    return () => {
      window.clearTimeout(unmountTimer);
    };
  }, [isVisible, onHide]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        role="status"
        className={`max-w-[calc(100vw-2rem)] rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl ${
          type === "error" ? "bg-red-500" : "bg-zinc-950"
        } animate-[toast-slide-up_220ms_ease-out,toast-fade-out_300ms_ease-in_2700ms_forwards]`}
      >
        {message}
      </div>

      <style jsx>{`
        @keyframes toast-slide-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes toast-fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
