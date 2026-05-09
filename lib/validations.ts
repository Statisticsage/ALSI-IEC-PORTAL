import { POSITION_GPA_REQUIREMENTS } from "./constants";
import { CandidateFormData } from "@/types";

export function validateEligibility(data: CandidateFormData) {
  const requiredGPA =
    POSITION_GPA_REQUIREMENTS[data.position];

  if (data.gpa < requiredGPA) {
    return {
      valid: false,
      message: `Minimum GPA requirement for ${data.position} is ${requiredGPA}`,
    };
  }

  if (
    data.position === "President" &&
    data.years_in_india < 1
  ) {
    return {
      valid: false,
      message:
        "President candidates must reside in India for at least 1 year.",
    };
  }

  if (
    data.position === "Treasurer" &&
    !data.finance_background
  ) {
    return {
      valid: false,
      message:
        "Treasurer requires finance or business background.",
    };
  }

  if (
    ["Secretary General", "Assistant Secretary General"].includes(
      data.position
    ) &&
    !data.computer_knowledge
  ) {
    return {
      valid: false,
      message:
        "Computer knowledge required for this position.",
    };
  }

  return {
    valid: true,
    message: "Eligible",
  };
}