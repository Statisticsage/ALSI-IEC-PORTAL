// ============================================================
// IEC DIGITAL REGISTRATION PORTAL — EXCEL EXPORT SYSTEM
// Dual destination: Supabase DB (primary) + Excel (IEC review)
// ============================================================

import * as XLSX from "xlsx";
import { Candidate, Voter, PoliticalParty, CandidatePosition } from "@/types";

// -------------------------------------------------------
// CANDIDATES EXPORT
// -------------------------------------------------------
export function exportCandidatesToExcel(
  candidates: Candidate[],
  filename = "IEC_Candidates_Register"
) {
  const rows = candidates.map((c, i) => ({
    "#": i + 1,
    "Application ID": c.application_id,
    "Full Name": c.full_name,
    Gender: c.gender,
    "Date of Birth": c.date_of_birth,
    Email: c.email,
    WhatsApp: c.whatsapp,
    "Passport Number": c.passport_number,
    University: c.university,
    "Degree Level": c.degree_level,
    "Course of Study": c.course_of_study,
    Semester: c.semester,
    GPA: c.gpa,
    "Years in India": c.years_in_india,
    "Position Applied": c.position_applied,
    "Political Party": c.political_party || "Independent",
    "Running Mate": c.running_mate || "N/A",
    Status: c.status.replace(/_/g, " ").toUpperCase(),
    "Admin Notes": c.admin_notes || "",
    "Submitted At": formatDate(c.submitted_at),
    "Last Updated": formatDate(c.updated_at),
  }));

  writeExcel(rows, "Candidates", filename);
}

// -------------------------------------------------------
// APPROVED CANDIDATES ONLY
// -------------------------------------------------------
export function exportApprovedCandidates(candidates: Candidate[]) {
  const approved = candidates.filter((c) => c.status === "approved");
  exportCandidatesToExcel(approved, "IEC_Approved_Candidates");
}

// -------------------------------------------------------
// VOTERS EXPORT
// -------------------------------------------------------
export function exportVotersToExcel(
  voters: Voter[],
  filename = "IEC_Voter_Register"
) {
  const rows = voters.map((v, i) => ({
    "#": i + 1,
    "Voter ID": v.voter_id_number || "Pending",
    "Full Name": v.full_name,
    Email: v.email,
    WhatsApp: v.whatsapp,
    University: v.university,
    "Student ID": v.student_id,
    "Passport Number": v.passport_number,
    "Current State (India)": v.current_state,
    "ALSI Member Status": v.alsi_member_status.toUpperCase(),
    "Verification Status": v.verification_status.replace(/_/g, " ").toUpperCase(),
    "Voter Approved": v.voter_approved ? "YES" : "NO",
    "Admin Notes": v.admin_notes || "",
    "Submitted At": formatDate(v.submitted_at),
  }));

  writeExcel(rows, "Voter Register", filename);
}

// -------------------------------------------------------
// POLITICAL PARTIES EXPORT
// -------------------------------------------------------
export function exportPartiesToExcel(
  parties: PoliticalParty[],
  filename = "IEC_Political_Parties"
) {
  const rows = parties.map((p, i) => ({
    "#": i + 1,
    "Party Name": p.party_name,
    Acronym: p.acronym,
    Motto: p.motto || "",
    Chairperson: p.chairperson_name,
    "Secretary General": p.secretary_general_name,
    "Contact Email": p.contact_email,
    WhatsApp: p.whatsapp,
    Description: p.description || "",
    Status: p.status.replace(/_/g, " ").toUpperCase(),
    "Admin Notes": p.admin_notes || "",
    "Submitted At": formatDate(p.submitted_at),
  }));

  writeExcel(rows, "Political Parties", filename);
}

// -------------------------------------------------------
// FINANCIAL TRACKING EXPORT
// -------------------------------------------------------
export function exportFinancialReport(candidates: Candidate[]) {
  const FEES: Record<string, number> = {
    President: 3200,
    "Vice President": 2800,
    "Secretary General": 1300,
    "Assistant Secretary General": 1000,
    Treasurer: 1200,
    "Financial Secretary": 1000,
    Chaplain: 600,
    "Student Representative": 600,
  };

  const rows = candidates
    .filter((c) => c.status === "approved")
    .map((c, i) => ({
      "#": i + 1,
      "Application ID": c.application_id,
      "Full Name": c.full_name,
      Position: c.position_applied,
      "Fee (INR)": FEES[c.position_applied] ?? 0,
      "Payment Proof": c.payment_url ? "Uploaded" : "Missing",
      "Submitted At": formatDate(c.submitted_at),
    }));

  const total = rows.reduce((sum, r) => sum + (r["Fee (INR)"] as number), 0);
  rows.push({
    "#": 0,
    "Application ID": "",
    "Full Name": "TOTAL",
    Position: "" as CandidatePosition,
    "Fee (INR)": total,
    "Payment Proof": "",
    "Submitted At": "",
  });

  writeExcel(rows, "Financial Report", "IEC_Financial_Report");
}

// -------------------------------------------------------
// FULL EXPORT (all sheets in one workbook)
// -------------------------------------------------------
export function exportFullRegister(
  candidates: Candidate[],
  voters: Voter[],
  parties: PoliticalParty[]
) {
  const wb = XLSX.utils.book_new();

  appendSheet(wb, candidates.map((c, i) => ({
    "#": i + 1,
    "Application ID": c.application_id,
    "Full Name": c.full_name,
    "Position": c.position_applied,
    "University": c.university,
    "GPA": c.gpa,
    "Status": c.status.replace(/_/g, " ").toUpperCase(),
    "Submitted At": formatDate(c.submitted_at),
  })), "Candidates");

  appendSheet(wb, voters.map((v, i) => ({
    "#": i + 1,
    "Voter ID": v.voter_id_number || "Pending",
    "Full Name": v.full_name,
    "University": v.university,
    "Approved": v.voter_approved ? "YES" : "NO",
    "Submitted At": formatDate(v.submitted_at),
  })), "Voters");

  appendSheet(wb, parties.map((p, i) => ({
    "#": i + 1,
    "Party Name": p.party_name,
    "Acronym": p.acronym,
    "Status": p.status.replace(/_/g, " ").toUpperCase(),
    "Submitted At": formatDate(p.submitted_at),
  })), "Political Parties");

  const date = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `IEC_Full_Register_${date}.xlsx`);
}

// -------------------------------------------------------
// INTERNAL HELPERS
// -------------------------------------------------------
function writeExcel(rows: object[], sheetName: string, filename: string) {
  const wb = XLSX.utils.book_new();
  appendSheet(wb, rows, sheetName);
  const date = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${filename}_${date}.xlsx`);
}

function appendSheet(wb: XLSX.WorkBook, rows: object[], sheetName: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  // Auto column widths
  const cols = Object.keys(rows[0] ?? {}).map((k) => ({
    wch: Math.max(k.length + 2, 16),
  }));
  ws["!cols"] = cols;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}