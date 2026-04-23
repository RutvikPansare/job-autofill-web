"use client";

export type FlatProfileField =
  | "full_name"
  | "first_name"
  | "last_name"
  | "email"
  | "phone"
  | "address"
  | "city"
  | "state"
  | "zip"
  | "country"
  | "linkedin"
  | "github"
  | "portfolio"
  | "work_authorization"
  | "visa_status"
  | "willing_to_relocate"
  | "desired_salary"
  | "engineering_focus"
  | "travel_preference"
  | "gender_identity"
  | "pronoun"
  | "sexual_orientation"
  | "race_ethnicity"
  | "hispanic_latino"
  | "veteran_status"
  | "disability_status";

export interface EducationEntry {
  school: string;
  degree_level: string;
  discipline: string;
  gpa: string;
  start_year: string;
  end_year: string;
}

export interface WorkEntry {
  company: string;
  role: string;
  description: string;
  start_date: string;
  end_date: string;
}

export interface ResumeRecord {
  id: string;
  name: string;
  size: number;
  data: string;
  keywords?: string[];
}

export interface CoverLetterRecord {
  id: string;
  name: string;
  content: string;
}

export interface AISettings {
  provider: "openai" | "claude";
  openai_api_key: string;
  claude_api_key: string;
  prefer_cheaper_model: boolean;
}

export interface ParsedResumePersonal {
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
}

export interface ParsedResume {
  personal: Partial<ParsedResumePersonal>;
  skills: string[];
  education: EducationEntry[];
  work_experience: WorkEntry[];
}

export interface ProfileData extends Record<FlatProfileField, string> {
  education: EducationEntry[];
  work_experience: WorkEntry[];
  skills: string[];
}

export interface ResumePreviewState {
  fileName: string;
  parsed: ParsedResume;
}

export interface InlineMessage {
  tone: "success" | "error" | "warn" | "info";
  message: string;
}
