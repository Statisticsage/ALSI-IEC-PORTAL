export interface VoterFormData {
  full_name: string;
  email: string;
  whatsapp: string;
  passport_number: string;
  current_state: string;
  alsi_member_status: string;
  university: string;
  student_id: string;
  passport_url?: string;
  student_id_url?: string;
  // DB column is voter_id_number — NOT voter_id
  voter_id_number?: string;
  verification_status?: 'pending' | 'approved' | 'rejected' | 'needs_correction';
  voter_approved?: boolean;
  submitted_at?: string;
  updated_at?: string;
  has_voted?: boolean;
  voted_at?: string | null;
}

export interface VoterStatusResult {
  voter_id_number: string | null;
  full_name: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'needs_correction';
  submitted_at: string;
  updated_at: string;
}