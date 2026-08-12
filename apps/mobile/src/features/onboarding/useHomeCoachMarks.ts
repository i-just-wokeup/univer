import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type CoachMarkRect,
  useCoachMarkRegistry,
} from "../../lib/coachMarks";
import { HOME_COACH_MARK_TARGETS } from "../../lib/coachMarkTargets";
import {
  getStoredHomeCoachMarkComplete,
  setStoredHomeCoachMarkComplete,
} from "./homeCoachMarkStorage";

type HomeCoachMarkStep = {
  message: string;
  targetId: string;
};

const HOME_COACH_MARK_STEPS: HomeCoachMarkStep[] = [
  {
    message: "스토리는 학생회·동아리·크리에이터가 올려요",
    targetId: HOME_COACH_MARK_TARGETS.storyBar,
  },
  {
    message: "사람 찾고, 추천 크루도 여기서 만나요",
    targetId: HOME_COACH_MARK_TARGETS.searchTab,
  },
  {
    message: "글·사진·영상은 여기서 올려요",
    targetId: HOME_COACH_MARK_TARGETS.createTab,
  },
  {
    message: "인기 게시물·콘텐츠를 여기서 발견해요",
    targetId: HOME_COACH_MARK_TARGETS.activityTab,
  },
];

const MEASURE_RETRY_COUNT = 12;
const MEASURE_RETRY_DELAY_MS = 100;

type CoachMarkPhase = "checking" | "complete" | "measuring" | "visible";

function waitForLayout() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, MEASURE_RETRY_DELAY_MS);
  });
}

export function useHomeCoachMarks(userId: string) {
  const { measureTarget, revision } = useCoachMarkRegistry();
  const [phase, setPhase] = useState<CoachMarkPhase>("checking");
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRects, setTargetRects] = useState<CoachMarkRect[]>([]);

  useEffect(() => {
    let cancelled = false;

    setPhase("checking");
    setStepIndex(0);
    setTargetRects([]);

    if (!userId) {
      setPhase("complete");
      return () => {
        cancelled = true;
      };
    }

    void getStoredHomeCoachMarkComplete(userId)
      .then((isComplete) => {
        if (!cancelled) {
          setPhase(isComplete ? "complete" : "measuring");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPhase("measuring");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (phase !== "measuring") {
      return;
    }

    let cancelled = false;

    const measureSteps = async () => {
      for (let attempt = 0; attempt < MEASURE_RETRY_COUNT; attempt += 1) {
        await waitForLayout();

        if (cancelled) {
          return;
        }

        const rects = await Promise.all(
          HOME_COACH_MARK_STEPS.map((step) => measureTarget(step.targetId)),
        );

        if (rects.every((rect): rect is CoachMarkRect => rect !== null)) {
          setTargetRects(rects);
          setPhase("visible");
          return;
        }
      }
    };

    void measureSteps();

    return () => {
      cancelled = true;
    };
  }, [measureTarget, phase, revision]);

  const complete = useCallback(() => {
    setPhase("complete");
    void setStoredHomeCoachMarkComplete(userId).catch(() => undefined);
  }, [userId]);

  const handleNext = useCallback(() => {
    if (stepIndex >= HOME_COACH_MARK_STEPS.length - 1) {
      complete();
      return;
    }

    setStepIndex((value) => value + 1);
  }, [complete, stepIndex]);

  return useMemo(
    () => ({
      isLastStep: stepIndex === HOME_COACH_MARK_STEPS.length - 1,
      isVisible:
        phase === "visible" &&
        targetRects.length === HOME_COACH_MARK_STEPS.length,
      message: HOME_COACH_MARK_STEPS[stepIndex]?.message ?? "",
      onNext: handleNext,
      onSkip: complete,
      stepIndex,
      targetRect: targetRects[stepIndex] ?? null,
      totalSteps: HOME_COACH_MARK_STEPS.length,
    }),
    [complete, handleNext, phase, stepIndex, targetRects],
  );
}
