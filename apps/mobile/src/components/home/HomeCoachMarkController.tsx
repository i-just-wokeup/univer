import { CoachMarkOverlay } from "../common/CoachMarkOverlay";
import { useHomeCoachMarks } from "../../features/onboarding/useHomeCoachMarks";

type HomeCoachMarkControllerProps = {
  userId: string;
};

export function HomeCoachMarkController({
  userId,
}: HomeCoachMarkControllerProps) {
  const coachMark = useHomeCoachMarks(userId);

  return (
    <CoachMarkOverlay
      isLastStep={coachMark.isLastStep}
      message={coachMark.message}
      onNext={coachMark.onNext}
      onSkip={coachMark.onSkip}
      stepIndex={coachMark.stepIndex}
      targetRect={coachMark.targetRect}
      totalSteps={coachMark.totalSteps}
      visible={coachMark.isVisible}
    />
  );
}
