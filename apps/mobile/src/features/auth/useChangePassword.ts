import { useState } from "react";

import {
  updateCurrentUserPassword,
  verifyCurrentPassword,
} from "./password";

const PASSWORD_MIN_LENGTH = 8;

function validateNewPassword(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirmation: string,
): string | null {
  if (newPassword !== newPasswordConfirmation) {
    return "새 비밀번호가 일치하지 않습니다.";
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return "새 비밀번호는 8자 이상이어야 합니다.";
  }

  if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return "새 비밀번호는 영문과 숫자를 모두 포함해야 합니다.";
  }

  if (newPassword === currentPassword) {
    return "현재 비밀번호와 다른 비밀번호를 입력해주세요.";
  }

  return null;
}

export function useChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");

  async function submit(): Promise<boolean> {
    if (isSubmitting) {
      return false;
    }

    if (!currentPassword) {
      setErrorMessage("현재 비밀번호를 입력해주세요.");
      return false;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await verifyCurrentPassword(currentPassword);

      const validationMessage = validateNewPassword(
        currentPassword,
        newPassword,
        newPasswordConfirmation,
      );
      if (validationMessage) {
        setErrorMessage(validationMessage);
        return false;
      }

      await updateCurrentUserPassword(newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "비밀번호를 변경하지 못했습니다.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    currentPassword,
    errorMessage,
    isSubmitting,
    newPassword,
    newPasswordConfirmation,
    setCurrentPassword,
    setNewPassword,
    setNewPasswordConfirmation,
    submit,
  };
}
