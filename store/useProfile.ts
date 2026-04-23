"use client";

import { create } from "zustand";
import { bridge } from "@/lib/bridge";
import {
  AI_SETTINGS_STORAGE_KEY,
  COMPLETION_FIELDS,
  COVER_LETTERS_STORAGE_KEY,
  createDefaultAISettings,
  createEmptyEducationEntry,
  createEmptyProfile,
  createEmptyWorkEntry,
  FLAT_FIELDS,
  genId,
  PROFILE_STORAGE_KEY,
  RESUMES_STORAGE_KEY,
  VALIDATORS,
} from "@/lib/profileConstants";
import { dedupeList, extractKeywords, parseResumeFileToText, parseResumeText, readFileAsDataUrl } from "@/lib/profileResume";
import type {
  AISettings,
  CoverLetterRecord,
  EducationEntry,
  FlatProfileField,
  InlineMessage,
  ParsedResume,
  ProfileData,
  ResumePreviewState,
  ResumeRecord,
  WorkEntry,
} from "@/types/profile";

interface ProfileState {
  profile: ProfileData;
  resumes: ResumeRecord[];
  coverLetters: CoverLetterRecord[];
  aiSettings: AISettings;
  loading: boolean;
  saving: boolean;
  resumeUploading: boolean;
  feedback: InlineMessage | null;
  resumeStatus: InlineMessage | null;
  validationErrors: Partial<Record<FlatProfileField, string>>;
  resumePreview: ResumePreviewState | null;
}

interface ProfileActions {
  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<boolean>;
  clearProfile: () => Promise<void>;
  subscribeToChanges: () => () => void;
  setFeedback: (feedback: InlineMessage | null) => void;
  setResumeStatus: (status: InlineMessage | null) => void;
  closeResumePreview: () => void;
  updateField: (field: FlatProfileField, value: string) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addEducation: () => void;
  updateEducation: (index: number, field: keyof EducationEntry, value: string) => void;
  removeEducation: (index: number) => void;
  addWork: () => void;
  updateWork: (index: number, field: keyof WorkEntry, value: string) => void;
  removeWork: (index: number) => void;
  addCoverLetter: () => void;
  updateCoverLetter: (id: string, field: keyof CoverLetterRecord, value: string) => void;
  removeCoverLetter: (id: string) => void;
  updateAISettings: <K extends keyof AISettings>(field: K, value: AISettings[K]) => void;
  uploadResume: (file: File) => Promise<void>;
  removeResume: (id: string) => Promise<void>;
  applyResumePreview: (parsed: ParsedResume) => Promise<void>;
}

type ProfileStore = ProfileState & ProfileActions;

function normalizeProfile(raw?: Record<string, unknown>): ProfileData {
  const base = createEmptyProfile();
  if (!raw) return base;

  for (const field of FLAT_FIELDS) {
    base[field] = raw[field] ? String(raw[field]) : "";
  }

  const education = Array.isArray(raw.education)
    ? raw.education.map((entry) => ({
        school: String((entry as Record<string, unknown>).school ?? ""),
        degree_level: String((entry as Record<string, unknown>).degree_level ?? ""),
        discipline: String((entry as Record<string, unknown>).discipline ?? ""),
        gpa: String((entry as Record<string, unknown>).gpa ?? ""),
        start_year: String((entry as Record<string, unknown>).start_year ?? ""),
        end_year: String((entry as Record<string, unknown>).end_year ?? ""),
      }))
    : [];
  const work = Array.isArray(raw.work_experience)
    ? raw.work_experience.map((entry) => ({
        company: String((entry as Record<string, unknown>).company ?? ""),
        role: String((entry as Record<string, unknown>).role ?? ""),
        description: String((entry as Record<string, unknown>).description ?? ""),
        start_date: String((entry as Record<string, unknown>).start_date ?? ""),
        end_date: String((entry as Record<string, unknown>).end_date ?? ""),
      }))
    : [];

  base.education = education.length ? education : [createEmptyEducationEntry()];
  base.work_experience = work.length ? work : [createEmptyWorkEntry()];
  base.skills = Array.isArray(raw.skills) ? raw.skills.map((item) => String(item)) : [];
  return base;
}

function normalizeResumes(raw?: unknown): ResumeRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => ({
    id: String((entry as Record<string, unknown>).id ?? genId()),
    name: String((entry as Record<string, unknown>).name ?? "Resume"),
    size: Number((entry as Record<string, unknown>).size ?? 0),
    data: String((entry as Record<string, unknown>).data ?? ""),
    keywords: Array.isArray((entry as Record<string, unknown>).keywords)
      ? ((entry as Record<string, unknown>).keywords as unknown[]).map(String)
      : [],
  }));
}

function normalizeCoverLetters(
  rawCoverLetters?: unknown,
  rawProfile?: Record<string, unknown>
): CoverLetterRecord[] {
  if (Array.isArray(rawCoverLetters) && rawCoverLetters.length) {
    return rawCoverLetters.map((entry) => ({
      id: String((entry as Record<string, unknown>).id ?? genId()),
      name: String((entry as Record<string, unknown>).name ?? "Cover Letter"),
      content: String((entry as Record<string, unknown>).content ?? ""),
    }));
  }

  const migratedTemplate = rawProfile?.cover_letter_template;
  if (typeof migratedTemplate === "string" && migratedTemplate.trim()) {
    return [{ id: genId(), name: "Cover Letter", content: migratedTemplate }];
  }

  return [];
}

function normalizeAISettings(raw?: Record<string, unknown>): AISettings {
  const defaults = createDefaultAISettings();
  if (!raw) return defaults;
  return {
    provider: raw.provider === "claude" ? "claude" : "openai",
    openai_api_key: String(raw.openai_api_key ?? ""),
    claude_api_key: String(raw.claude_api_key ?? ""),
    prefer_cheaper_model: raw.prefer_cheaper_model !== false,
  };
}

function validateProfile(profile: ProfileData): Partial<Record<FlatProfileField, string>> {
  const errors: Partial<Record<FlatProfileField, string>> = {};
  for (const [field, validator] of Object.entries(VALIDATORS) as Array<[FlatProfileField, (value: string) => boolean]>) {
    if (!validator(profile[field])) {
      errors[field] = "Please enter a valid value.";
    }
  }
  return errors;
}

function buildSavableProfile(profile: ProfileData): ProfileData {
  const next = { ...profile };
  if (next.full_name && (!next.first_name || !next.last_name)) {
    const parts = next.full_name.trim().split(/\s+/);
    if (!next.first_name) next.first_name = parts[0] || "";
    if (!next.last_name) next.last_name = parts.slice(1).join(" ") || "";
  }
  next.skills = profile.skills.filter((skill) => skill.trim());
  next.education = profile.education.filter((entry) => Object.values(entry).some((value) => String(value || "").trim()));
  next.work_experience = profile.work_experience.filter((entry) => Object.values(entry).some((value) => String(value || "").trim()));
  return next;
}

function mergeParsedIntoProfile(profile: ProfileData, parsed: ParsedResume) {
  const nextProfile = { ...profile };
  let flat = 0;
  for (const [field, value] of Object.entries(parsed.personal || {}) as Array<[FlatProfileField, string]>) {
    if (!value) continue;
    if (nextProfile[field].trim() !== value.trim()) {
      nextProfile[field] = value;
      flat += 1;
    }
  }

  let skillsCount = 0;
  if (parsed.skills.length) {
    const nextSkills = dedupeList([...nextProfile.skills, ...parsed.skills]);
    skillsCount = Math.max(0, nextSkills.length - nextProfile.skills.length);
    nextProfile.skills = nextSkills;
  }

  const education = parsed.education.length
    ? parsed.education.map((entry) => ({ ...createEmptyEducationEntry(), ...entry }))
    : nextProfile.education;
  const work = parsed.work_experience.length
    ? parsed.work_experience.map((entry) => ({ ...createEmptyWorkEntry(), ...entry }))
    : nextProfile.work_experience;

  nextProfile.education = education;
  nextProfile.work_experience = work;

  return {
    profile: nextProfile,
    summary: {
      flat,
      skills: skillsCount,
      education: parsed.education.length,
      work: parsed.work_experience.length,
      total: flat + skillsCount + parsed.education.length + parsed.work_experience.length,
    },
  };
}

export function getProfileCompletion(profile: ProfileData): number {
  const filled = COMPLETION_FIELDS.filter((field) => profile[field].trim().length > 0).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: createEmptyProfile(),
  resumes: [],
  coverLetters: [],
  aiSettings: createDefaultAISettings(),
  loading: false,
  saving: false,
  resumeUploading: false,
  feedback: null,
  resumeStatus: null,
  validationErrors: {},
  resumePreview: null,

  async loadProfile() {
    set({ loading: true });
    try {
      const result = await bridge.storageGet([
        PROFILE_STORAGE_KEY,
        RESUMES_STORAGE_KEY,
        COVER_LETTERS_STORAGE_KEY,
        AI_SETTINGS_STORAGE_KEY,
      ]);
      const profileRaw = result[PROFILE_STORAGE_KEY] as Record<string, unknown> | undefined;
      const profile = normalizeProfile(profileRaw);
      const resumes = normalizeResumes(result[RESUMES_STORAGE_KEY]);
      const coverLetters = normalizeCoverLetters(
        result[COVER_LETTERS_STORAGE_KEY],
        profileRaw
      );
      const aiSettings = normalizeAISettings(
        result[AI_SETTINGS_STORAGE_KEY] as Record<string, unknown> | undefined
      );

      set({
        profile,
        resumes,
        coverLetters,
        aiSettings,
        loading: false,
      });

      if (!result[COVER_LETTERS_STORAGE_KEY] && coverLetters.length) {
        await bridge.storageSet({ [COVER_LETTERS_STORAGE_KEY]: coverLetters });
      }
    } catch (error) {
      console.error("[ProfileStore] loadProfile failed:", error);
      set({
        loading: false,
        feedback: { tone: "error", message: "Profile data could not be loaded." },
      });
    }
  },

  async saveProfile() {
    const current = get().profile;
    const validationErrors = validateProfile(current);
    if (Object.keys(validationErrors).length > 0) {
      set({
        validationErrors,
        feedback: { tone: "error", message: "Please fix the highlighted fields." },
      });
      return false;
    }

    set({ saving: true, validationErrors: {}, feedback: null });
    try {
      const profile = buildSavableProfile(get().profile);
      const coverLetters = get().coverLetters;
      const aiSettings = get().aiSettings;

      await bridge.storageSet({
        [PROFILE_STORAGE_KEY]: profile,
        [COVER_LETTERS_STORAGE_KEY]: coverLetters,
        [AI_SETTINGS_STORAGE_KEY]: aiSettings,
      });

      set({
        profile,
        saving: false,
        feedback: { tone: "success", message: "Profile saved to Chrome storage." },
      });
      return true;
    } catch (error) {
      console.error("[ProfileStore] saveProfile failed:", error);
      set({
        saving: false,
        feedback: { tone: "error", message: "Profile save failed." },
      });
      return false;
    }
  },

  async clearProfile() {
    set({ saving: true, feedback: null, resumeStatus: null, resumePreview: null });
    try {
      const emptyProfile = createEmptyProfile();
      await bridge.storageRemove([
        "resume_pdf",
        "cover_letter_pdf",
      ]);
      await bridge.storageSet({
        [PROFILE_STORAGE_KEY]: emptyProfile,
        [RESUMES_STORAGE_KEY]: [],
        [COVER_LETTERS_STORAGE_KEY]: [],
      });
      set({
        profile: emptyProfile,
        resumes: [],
        coverLetters: [],
        saving: false,
        feedback: { tone: "warn", message: "Profile, resumes, and cover letters were cleared." },
      });
    } catch (error) {
      console.error("[ProfileStore] clearProfile failed:", error);
      set({
        saving: false,
        feedback: { tone: "error", message: "Profile clear failed." },
      });
    }
  },

  subscribeToChanges() {
    return bridge.onChanged((changes, area) => {
      if (area !== "local") return;
      if (
        changes[PROFILE_STORAGE_KEY] ||
        changes[RESUMES_STORAGE_KEY] ||
        changes[COVER_LETTERS_STORAGE_KEY] ||
        changes[AI_SETTINGS_STORAGE_KEY]
      ) {
        get().loadProfile().catch((error) => {
          console.error("[ProfileStore] change sync failed:", error);
        });
      }
    });
  },

  setFeedback(feedback) {
    set({ feedback });
  },

  setResumeStatus(status) {
    set({ resumeStatus: status });
  },

  closeResumePreview() {
    set({ resumePreview: null });
  },

  updateField(field, value) {
    set((state) => ({
      profile: { ...state.profile, [field]: value },
      validationErrors: { ...state.validationErrors, [field]: undefined },
    }));
  },

  addSkill(skill) {
    const cleaned = skill.trim();
    if (!cleaned) return;
    set((state) => ({
      profile: {
        ...state.profile,
        skills: dedupeList([...state.profile.skills, cleaned]),
      },
    }));
  },

  removeSkill(skill) {
    set((state) => ({
      profile: {
        ...state.profile,
        skills: state.profile.skills.filter((entry) => entry !== skill),
      },
    }));
  },

  addEducation() {
    set((state) => ({
      profile: {
        ...state.profile,
        education: [...state.profile.education, createEmptyEducationEntry()],
      },
    }));
  },

  updateEducation(index, field, value) {
    set((state) => ({
      profile: {
        ...state.profile,
        education: state.profile.education.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, [field]: value } : entry
        ),
      },
    }));
  },

  removeEducation(index) {
    set((state) => {
      const education = state.profile.education.filter((_, entryIndex) => entryIndex !== index);
      return {
        profile: {
          ...state.profile,
          education: education.length ? education : [createEmptyEducationEntry()],
        },
      };
    });
  },

  addWork() {
    set((state) => ({
      profile: {
        ...state.profile,
        work_experience: [...state.profile.work_experience, createEmptyWorkEntry()],
      },
    }));
  },

  updateWork(index, field, value) {
    set((state) => ({
      profile: {
        ...state.profile,
        work_experience: state.profile.work_experience.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, [field]: value } : entry
        ),
      },
    }));
  },

  removeWork(index) {
    set((state) => {
      const work = state.profile.work_experience.filter((_, entryIndex) => entryIndex !== index);
      return {
        profile: {
          ...state.profile,
          work_experience: work.length ? work : [createEmptyWorkEntry()],
        },
      };
    });
  },

  addCoverLetter() {
    set((state) => ({
      coverLetters: [
        ...state.coverLetters,
        { id: genId(), name: `Cover Letter ${state.coverLetters.length + 1}`, content: "" },
      ],
    }));
  },

  updateCoverLetter(id, field, value) {
    set((state) => ({
      coverLetters: state.coverLetters.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    }));
  },

  removeCoverLetter(id) {
    set((state) => ({
      coverLetters: state.coverLetters.filter((entry) => entry.id !== id),
    }));
  },

  updateAISettings(field, value) {
    set((state) => ({
      aiSettings: { ...state.aiSettings, [field]: value },
    }));
  },

  async uploadResume(file) {
    const lowerName = file?.name?.toLowerCase?.() || "";
    const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx");

    if (!isPdf && !isDocx) {
      set({
        resumeStatus: { tone: "error", message: "Please upload a PDF or DOCX resume." },
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      set({
        resumeStatus: {
          tone: "warn",
          message: "Resume is too large to parse reliably. Please use a file under 5 MB.",
        },
      });
      return;
    }

    set({
      resumeUploading: true,
      resumeStatus: { tone: "info", message: `Uploading and parsing ${file.name}...` },
    });

    try {
      const dataUrl = await readFileAsDataUrl(file);
      let text = "";
      let keywords: string[] = [];

      try {
        text = await parseResumeFileToText(file);
        keywords = extractKeywords(text);
      } catch (error) {
        console.warn("[ProfileStore] Resume text extraction failed:", error);
      }

      const record: ResumeRecord = {
        id: genId(),
        name: file.name,
        size: file.size,
        data: dataUrl,
        keywords,
      };
      const resumes = [...get().resumes, record];
      await bridge.storageSet({ [RESUMES_STORAGE_KEY]: resumes });

      if (!text) {
        set({
          resumes,
          resumeUploading: false,
          resumeStatus: {
            tone: "warn",
            message: `Uploaded ${file.name}, but the resume text could not be parsed for autofill.`,
          },
        });
        return;
      }

      const parsed = parseResumeText(text);
      const hasParsedContent =
        Object.values(parsed.personal || {}).some(Boolean) ||
        parsed.skills.length ||
        parsed.education.length ||
        parsed.work_experience.length;

      if (!hasParsedContent) {
        set({
          resumes,
          resumeUploading: false,
          resumeStatus: {
            tone: "warn",
            message: "Resume uploaded, but no profile details could be confidently extracted.",
          },
        });
        return;
      }

      set({
        resumes,
        resumeUploading: false,
        resumeStatus: {
          tone: "success",
          message: `Parsed ${file.name}. Review the extracted details before applying them.`,
        },
        resumePreview: { fileName: file.name, parsed },
      });
    } catch (error) {
      console.warn("[ProfileStore] Resume upload failed:", error);
      set({
        resumeUploading: false,
        resumeStatus: {
          tone: "error",
          message: error instanceof Error ? error.message : "Resume parsing failed.",
        },
      });
    }
  },

  async removeResume(id) {
    const resumes = get().resumes.filter((entry) => entry.id !== id);
    await bridge.storageSet({ [RESUMES_STORAGE_KEY]: resumes });
    set({
      resumes,
      resumeStatus: { tone: "warn", message: "Resume removed." },
    });
  },

  async applyResumePreview(parsed) {
    const merge = mergeParsedIntoProfile(get().profile, parsed);
    set({
      profile: merge.profile,
      resumePreview: null,
    });

    if (!merge.summary.total) {
      set({
        resumeStatus: {
          tone: "warn",
          message: "Nothing changed because your profile fields already had values.",
        },
      });
      return;
    }

    const summary = [
      merge.summary.flat ? `${merge.summary.flat} profile field${merge.summary.flat === 1 ? "" : "s"}` : "",
      merge.summary.skills ? `${merge.summary.skills} skill${merge.summary.skills === 1 ? "" : "s"}` : "",
      merge.summary.education ? `${merge.summary.education} education entr${merge.summary.education === 1 ? "y" : "ies"}` : "",
      merge.summary.work ? `${merge.summary.work} work entr${merge.summary.work === 1 ? "y" : "ies"}` : "",
    ].filter(Boolean).join(", ");

    set({
      resumeStatus: {
        tone: "success",
        message: `Applied parsed resume details: ${summary}.`,
      },
    });
    await get().saveProfile();
  },
}));
