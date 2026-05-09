import { CandidatePosition } from "@/types";

export const POSITIONS: CandidatePosition[] = [
  "President",
  "Vice President",
  "Secretary General",
  "Assistant Secretary General",
  "Treasurer",
  "Financial Secretary",
  "Chaplain",
  "Student Representative",
];

export const POSITION_FEES: Record<CandidatePosition, number> = {
  President: 3200,
  "Vice President": 2800,
  "Secretary General": 1300,
  "Assistant Secretary General": 1000,
  Treasurer: 1200,
  "Financial Secretary": 1000,
  Chaplain: 600,
  "Student Representative": 600,
};

export const POSITION_GPA_REQUIREMENTS: Record<CandidatePosition, number> = {
  President: 7.0,
  "Vice President": 6.5,
  "Secretary General": 6.0,
  "Assistant Secretary General": 6.0,
  Treasurer: 6.0,
  "Financial Secretary": 6.0,
  Chaplain: 5.0,
  "Student Representative": 6.5,
};

export const PARTY_FEE = 2200;

export const UNIVERSITIES = [
  "Amity University",
  "Bennett University",
  "Christ University",
  "Delhi University",
  "Galgotias University",
  "Graphic Era University",
  "Jamia Millia Islamia",
  "Jawaharlal Nehru University (JNU)",
  "Lovely Professional University (LPU)",
  "Manipal University",
  "Noida International University",
  "Saveetha University",
  "Sharda University",
  "SRM University",
  "Symbiosis International University",
  "VIT University",
];

export const DEGREE_LEVELS = [
  "Bachelor's Degree (MBBS)",
  "Bachelor's Degree (BDS)",
  "Bachelor's Degree (B.Tech)",
  "Bachelor's Degree (BBA)",
  "Bachelor's Degree (B.Com)",
  "Bachelor's Degree (B.Sc)",
  "Bachelor's Degree (LLB)",
  "Master's Degree (MD)",
  "Master's Degree (MS)",
  "Master's Degree (MBA)",
  "Master's Degree (M.Tech)",
  "Master's Degree (M.Sc)",
  "PhD / Doctorate",
];

export const SEMESTERS = [
  "1st Semester", "2nd Semester", "3rd Semester",
  "4th Semester", "5th Semester", "6th Semester",
  "7th Semester", "8th Semester", "9th Semester",
  "10th Semester", "11th Semester", "12th Semester",
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chhattisgarh", "Delhi (NCT)",
  "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

export const APPLICATION_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "under_review", label: "Under Review", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "needs_correction", label: "Needs Correction", color: "bg-orange-100 text-orange-800 border-orange-200" },
];