// ============================================================
// IEC DIGITAL REGISTRATION PORTAL — TYPE DEFINITIONS
// Aligned to datawarehouse Supabase schema
// ============================================================

export type CandidatePosition =
  | "President"
  | "Vice President"
  | "Secretary General"
  | "Assistant Secretary General"
  | "Treasurer"
  | "Financial Secretary"
  | "Chaplain"
  | "Student Representative";

export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "needs_correction";

export type AdminRole =
  | "chairperson"
  | "co_chairperson"
  | "secretary_general"
  | "pro"
  | "iec_member";

export type ALSIMemberStatus =
  | "active"
  | "inactive"
  | "unknown";

// -------------------------------------------------------
// CANDIDATE — matches candidates table exactly
// -------------------------------------------------------
export interface CandidateFormData {
  full_name: string;
  gender: string;
  date_of_birth: string;
  email: string;
  whatsapp: string;
  passport_number: string;
  residential_address: string;
  university: string;
  degree_level: string;
  course_of_study: string;
  semester: string;
  gpa: number;
  years_in_india: number;
  position_applied: CandidatePosition;
  political_party: string;
  running_mate: string;
  // document URLs — set after upload
  passport_url: string;
  transcript_url: string;
  photo_url: string;
  signature_url: string;
  payment_url: string;
  letter_of_intent_url: string;
}

export interface Candidate extends CandidateFormData {
  id: string;
  application_id: string;
  status: ApplicationStatus;
  admin_notes: string | null;
  submitted_at: string;
  updated_at: string;
}

// -------------------------------------------------------
// VOTER — matches voters table exactly
// -------------------------------------------------------
export interface VoterFormData {
  full_name: string;
  email: string;
  whatsapp: string;
  university: string;
  student_id: string;
  passport_number: string;
  current_state: string;
  alsi_member_status: ALSIMemberStatus;
  // document URLs — set after upload
  passport_url: string;
  student_id_url: string;
}

export interface Voter extends VoterFormData {
  id: string;
  voter_id_number: string;
  verification_status: ApplicationStatus;
  voter_approved: boolean;
  admin_notes: string | null;
  submitted_at: string;
  updated_at: string;
}

// -------------------------------------------------------
// POLITICAL PARTY — matches political_parties table exactly
// -------------------------------------------------------
export interface PartyFormData {
  party_name: string;
  acronym: string;
  motto: string;
  chairperson_name: string;
  secretary_general_name: string;
  contact_email: string;
  whatsapp: string;
  description: string;
  // document URLs — set after upload
  symbol_url: string;
  payment_proof_url: string;
}

export interface PoliticalParty extends PartyFormData {
  id: string;
  status: ApplicationStatus;
  admin_notes: string | null;
  submitted_at: string;
  updated_at: string;
}

// -------------------------------------------------------
// ADMIN USER — matches admin_users table exactly
// -------------------------------------------------------
export interface AdminUser {
  id: string;
  full_name: string;
  role: AdminRole;
  email: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

// -------------------------------------------------------
// AUDIT LOG — matches audit_logs table exactly
// -------------------------------------------------------
export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  action_type: "approve" | "reject" | "request_info" | "update" | "create" | "delete" | "export" | "login" | "logout";
  target_type: "candidate" | "voter" | "political_party" | "admin_user" | "system";
  target_id: string | null;
  description: string;
  ip_address: string | null;
  timestamp: string;
}

// -------------------------------------------------------
// DASHBOARD STATS
// -------------------------------------------------------
export interface DashboardStats {
  total_candidates: number;
  pending_candidates: number;
  approved_candidates: number;
  rejected_candidates: number;
  total_voters: number;
  approved_voters: number;
  total_parties: number;
  approved_parties: number;
}