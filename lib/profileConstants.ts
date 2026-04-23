import type { AISettings, EducationEntry, FlatProfileField, ProfileData, WorkEntry } from "@/types/profile";

export const PROFILE_STORAGE_KEY = "profile";
export const RESUMES_STORAGE_KEY = "resumes";
export const COVER_LETTERS_STORAGE_KEY = "cover_letters";
export const AI_SETTINGS_STORAGE_KEY = "ai_settings";

export const FLAT_FIELDS: FlatProfileField[] = [
  "full_name", "first_name", "last_name", "email", "phone",
  "address", "city", "state", "zip", "country",
  "linkedin", "github", "portfolio",
  "work_authorization", "visa_status", "willing_to_relocate",
  "desired_salary",
  "engineering_focus", "travel_preference",
  "gender_identity", "pronoun", "sexual_orientation",
  "race_ethnicity", "hispanic_latino",
  "veteran_status", "disability_status",
];

export const COMPLETION_FIELDS: FlatProfileField[] = [
  "full_name",
  "email",
  "phone",
  "linkedin",
];

export const VALIDATORS: Partial<Record<FlatProfileField, (value: string) => boolean>> = {
  email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  linkedin: (value) => !value || value.startsWith("https://") || value.startsWith("http://"),
  github: (value) => !value || value.startsWith("https://") || value.startsWith("http://"),
};

export const DEGREE_LEVELS = [
  "High School Diploma / GED",
  "Some College (No Degree)",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Master of Business Administration (MBA)",
  "Doctor of Philosophy (PhD)",
  "Doctor of Medicine (MD)",
  "Juris Doctor (JD)",
  "Other",
];

export const DISCIPLINES = [
  "Computer Science",
  "Computer Engineering",
  "Software Engineering",
  "Information Technology",
  "Information Systems",
  "Cybersecurity",
  "Data Science",
  "Artificial Intelligence",
  "Human-Computer Interaction",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biomedical Engineering",
  "Industrial Engineering",
  "Aerospace Engineering",
  "Mathematics",
  "Applied Mathematics",
  "Statistics",
  "Physics",
  "Chemistry",
  "Biology",
  "Neuroscience",
  "Business Administration",
  "Finance",
  "Accounting",
  "Economics",
  "Marketing",
  "Management",
  "Operations Management",
  "Psychology",
  "Communications",
  "Linguistics",
  "Education",
  "Other",
];

export function createEmptyEducationEntry(): EducationEntry {
  return {
    school: "",
    degree_level: "",
    discipline: "",
    gpa: "",
    start_year: "",
    end_year: "",
  };
}

export function createEmptyWorkEntry(): WorkEntry {
  return {
    company: "",
    role: "",
    description: "",
    start_date: "",
    end_date: "",
  };
}

export function createEmptyProfile(): ProfileData {
  const profile = {} as Record<FlatProfileField, string>;
  for (const field of FLAT_FIELDS) profile[field] = "";
  return {
    ...(profile as Record<FlatProfileField, string>),
    education: [createEmptyEducationEntry()],
    work_experience: [createEmptyWorkEntry()],
    skills: [],
  };
}

export function createDefaultAISettings(): AISettings {
  return {
    provider: "openai",
    openai_api_key: "",
    claude_api_key: "",
    prefer_cheaper_model: true,
  };
}

export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `jf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
