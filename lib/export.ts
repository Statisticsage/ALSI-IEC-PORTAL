// ============================================================
// IEC DIGITAL REGISTRATION PORTAL — EXCEL EXPORT SYSTEM
// Dual destination: Supabase DB (primary) + Excel (IEC review)
// ============================================================

import * as ExcelJS from 'exceljs';
import { Candidate, Voter, PoliticalParty, CandidatePosition } from "@/types";

// -------------------------------------------------------
// CANDIDATES EXPORT
// -------------------------------------------------------
export async function exportCandidatesToExcel(
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

  await writeExcel(rows, "Candidates", filename);
}

// -------------------------------------------------------
// APPROVED CANDIDATES ONLY
// -------------------------------------------------------
export async function exportApprovedCandidates(candidates: Candidate[]) {
  const approved = candidates.filter((c) => c.status === "approved");
  await exportCandidatesToExcel(approved, "IEC_Approved_Candidates");
}

// -------------------------------------------------------
// VOTERS EXPORT
// -------------------------------------------------------
export async function exportVotersToExcel(
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

  await writeExcel(rows, "Voter Register", filename);
}

// -------------------------------------------------------
// POLITICAL PARTIES EXPORT
// -------------------------------------------------------
export async function exportPartiesToExcel(
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

  await writeExcel(rows, "Political Parties", filename);
}

// -------------------------------------------------------
// FINANCIAL TRACKING EXPORT
// -------------------------------------------------------
export async function exportFinancialReport(candidates: Candidate[]) {
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

  await writeExcel(rows, "Financial Report", "IEC_Financial_Report");
}

// -------------------------------------------------------
// FULL EXPORT (all sheets in one workbook)
// -------------------------------------------------------
export async function exportFullRegister(
  candidates: Candidate[],
  voters: Voter[],
  parties: PoliticalParty[]
) {
  const wb = new ExcelJS.Workbook();

  await appendSheet(wb, candidates.map((c, i) => ({
    "#": i + 1,
    "Application ID": c.application_id,
    "Full Name": c.full_name,
    Position: c.position_applied,
    University: c.university,
    GPA: c.gpa,
    Status: c.status.replace(/_/g, " ").toUpperCase(),
    "Submitted At": formatDate(c.submitted_at),
  })), "Candidates");

  await appendSheet(wb, voters.map((v, i) => ({
    "#": i + 1,
    "Voter ID": v.voter_id_number || "Pending",
    "Full Name": v.full_name,
    University: v.university,
    Approved: v.voter_approved ? "YES" : "NO",
    "Submitted At": formatDate(v.submitted_at),
  })), "Voters");

  await appendSheet(wb, parties.map((p, i) => ({
    "#": i + 1,
    "Party Name": p.party_name,
    Acronym: p.acronym,
    Status: p.status.replace(/_/g, " ").toUpperCase(),
    "Submitted At": formatDate(p.submitted_at),
  })), "Political Parties");

  const date = new Date().toISOString().split("T")[0];
  
  if (typeof window !== 'undefined') {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IEC_Full_Register_${date}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    await wb.xlsx.writeFile(`IEC_Full_Register_${date}.xlsx`);
  }
}

// -------------------------------------------------------
// INTERNAL HELPERS
// -------------------------------------------------------
async function writeExcel(rows: object[], sheetName: string, filename: string) {
  const wb = new ExcelJS.Workbook();
  await appendSheet(wb, rows, sheetName);
  const date = new Date().toISOString().split("T")[0];
  
  // Set up response for browser download
  if (typeof window !== 'undefined') {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${date}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    // Server-side: write to file system
    await wb.xlsx.writeFile(`${filename}_${date}.xlsx`);
  }
}

async function appendSheet(wb: ExcelJS.Workbook, rows: object[], sheetName: string) {
  const ws = wb.addWorksheet(sheetName);
  
  if (rows.length > 0) {
    // Add headers
    const headers = Object.keys(rows[0]);
    ws.addRow(headers);
    
    // Add data rows
    rows.forEach(row => {
      ws.addRow(Object.values(row));
    });
    
    // Auto-fit columns
    ws.columns.forEach((column, index) => {
      const header = headers[index];
      if (header) {
        column.width = Math.max(header.length + 2, 16);
      }
    });
    
    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
  }
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}