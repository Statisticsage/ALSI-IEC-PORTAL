import {
  POSITION_GPA_REQUIREMENTS,
} from "./constants";

import {
  CandidateFormData,
  CandidatePosition,
} from "@/types";

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export function validateEligibility(
  data: CandidateFormData
): ValidationResult {
  const position =
    data.position_applied as CandidatePosition;

  const requiredGPA =
    POSITION_GPA_REQUIREMENTS[position];

  // -------------------------------------------------------
  // GPA VALIDATION
  // -------------------------------------------------------

  if (data.gpa < requiredGPA) {
    return {
      valid: false,
      message: `Minimum GPA requirement for ${position} is ${requiredGPA}.`,
    };
  }

  // -------------------------------------------------------
  // PRESIDENT RESIDENCY VALIDATION
  // -------------------------------------------------------

  if (
    position === "President" &&
    data.years_in_india < 1
  ) {
    return {
      valid: false,
      message:
        "President candidates must reside in India for at least 1 year.",
    };
  }

  // -------------------------------------------------------
  // VALID RESULT
  // -------------------------------------------------------

  return {
    valid: true,
    message: "Eligible",
  };
}