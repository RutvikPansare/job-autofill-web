import type { EducationEntry, ParsedResume, WorkEntry } from "@/types/profile";
import { DISCIPLINES } from "@/lib/profileConstants";

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (options: { data: ArrayBuffer; disableWorker?: boolean }) => { promise: Promise<any> };
    };
  }
}

export async function parseResumeFileToText(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
    return extractTextFromPdf(file);
  }
  if (
    lowerName.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDocx(file);
  }
  throw new Error("Unsupported resume file type.");
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read the resume file."));
    reader.readAsDataURL(file);
  });
}

export function parseResumeText(text: string): ParsedResume {
  const cleanedText = normalizeResumeText(text);
  const sections = extractResumeSections(cleanedText);
  const preambleLines = splitSectionLines(sections.preamble);
  const personal = parsePersonalInfo(preambleLines);
  const skills = parseSkillsSection(splitSectionLines(sections.skills));
  const education = parseEducationSection(splitSectionLines(sections.education));
  const work = parseExperienceSection(sections.experience);

  return {
    personal,
    skills,
    education,
    work_experience: work,
  };
}

export function extractKeywords(text: string): string[] {
  const matches = text.match(/[A-Za-z][A-Za-z0-9+#./-]{2,}/g) || [];
  return dedupeList(matches).slice(0, 60);
}

async function extractTextFromPdf(file: File): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("PDF parser is unavailable.");
  }
  await ensurePdfJsLoaded();
  if (!window.pdfjsLib) {
    throw new Error("PDF parser is unavailable.");
  }
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({
    data: buffer,
    disableWorker: true,
  }).promise;
  const chunks: string[] = [];
  const linkUrls: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    chunks.push(buildPdfPageText(content.items || []));
    try {
      const annotations = await page.getAnnotations();
      for (const anno of annotations) {
        if (anno.subtype === "Link" && anno.url) {
          linkUrls.push(anno.url);
        }
      }
    } catch (error) {
      console.warn("[Profile Resume] Failed to read PDF annotations:", error);
    }
  }

  if (linkUrls.length > 0) chunks.unshift(linkUrls.join("\n"));
  const text = chunks.join("\n").replace(/\s+\n/g, "\n").trim();
  if (!text) throw new Error("This PDF appears empty or unreadable.");
  return text;
}

let pdfJsLoadPromise: Promise<void> | null = null;

async function ensurePdfJsLoaded(): Promise<void> {
  if (typeof window === "undefined" || window.pdfjsLib) return;
  if (pdfJsLoadPromise) return pdfJsLoadPromise;

  pdfJsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-jobfill-pdfjs="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PDF parser failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/pdf.min.js";
    script.async = true;
    script.dataset.jobfillPdfjs = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("PDF parser failed to load."));
    document.head.appendChild(script);
  });

  return pdfJsLoadPromise;
}

function buildPdfPageText(items: any[]): string {
  type Part = { x: number; w: number; str: string };
  const rows: Array<{ y: number; parts: Part[] }> = [];

  for (const item of items) {
    const str = String(item?.str || "");
    if (!str.trim()) continue;
    const x = item?.transform?.[4] ?? 0;
    const y = item?.transform?.[5] ?? 0;
    const w = item?.width ?? 0;
    const existing = rows.find((row) => Math.abs(row.y - y) < 2.5);
    if (existing) {
      existing.parts.push({ x, w, str });
    } else {
      rows.push({ y, parts: [{ x, w, str }] });
    }
  }

  const outputLines: string[] = [];

  for (const row of rows.sort((a, b) => b.y - a.y)) {
    const sorted = row.parts.sort((a, b) => a.x - b.x);
    if (!sorted.length) continue;

    // Build segments: a large x-gap means a separate column → emit as a new line
    const segments: string[] = [];
    let seg = sorted[0].str;

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const gap = curr.x - (prev.x + prev.w);

      if (gap > 80) {
        // Two-column layout: right-side content becomes its own line
        if (seg.trim()) segments.push(seg.trim());
        seg = curr.str;
      } else if (gap < 2) {
        // Character-level positioning (e.g. "Roche" + "s" + "ter"): join without space
        seg += curr.str;
      } else {
        seg += " " + curr.str;
      }
    }
    if (seg.trim()) segments.push(seg.trim());
    outputLines.push(...segments);
  }

  return outputLines.join("\n");
}

async function extractTextFromDocx(file: File): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DOCX parsing is not supported in this browser.");
  }
  const buffer = await file.arrayBuffer();
  const entries = await unzipDocxEntries(buffer, [
    "word/document.xml",
    "word/header1.xml",
    "word/header2.xml",
    "word/header3.xml",
    "word/footer1.xml",
    "word/footer2.xml",
    "word/footer3.xml",
    "word/_rels/document.xml.rels",
  ]);

  const parts: string[] = [];
  if (entries["word/_rels/document.xml.rels"]) {
    const matches = entries["word/_rels/document.xml.rels"].match(/Target="([^"]+)"/g);
    if (matches) {
      const urls = matches
        .map((match) => match.match(/Target="([^"]+)"/)?.[1] || "")
        .filter((url) => url.startsWith("http"));
      if (urls.length > 0) parts.push(urls.join("\n"));
    }
  }

  const orderedKeys = [
    "word/header1.xml",
    "word/header2.xml",
    "word/header3.xml",
    "word/document.xml",
    "word/footer1.xml",
    "word/footer2.xml",
    "word/footer3.xml",
  ];

  for (const key of orderedKeys) {
    if (entries[key]) {
      parts.push(extractTextFromWordXml(entries[key]));
    }
  }

  const text = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("This DOCX appears empty or unreadable.");
  return text;
}

async function unzipDocxEntries(
  arrayBuffer: ArrayBuffer,
  wantedPaths: string[]
): Promise<Record<string, string>> {
  const bytes = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder();
  const wanted = new Set(wantedPaths);
  const output: Record<string, string> = {};
  let offset = 0;

  while (offset + 30 <= bytes.length) {
    const signature = readUInt32LE(bytes, offset);
    if (signature === 0x02014b50 || signature === 0x06054b50) break;
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compressionMethod = readUInt16LE(bytes, offset + 8);
    const compressedSize = readUInt32LE(bytes, offset + 18);
    const fileNameLength = readUInt16LE(bytes, offset + 26);
    const extraLength = readUInt16LE(bytes, offset + 28);
    const fileName = decoder.decode(bytes.slice(offset + 30, offset + 30 + fileNameLength));
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (wanted.has(fileName)) {
      const compressed = bytes.slice(dataStart, dataEnd);
      const uncompressed =
        compressionMethod === 0
          ? compressed
          : compressionMethod === 8
            ? await inflateRaw(compressed)
            : null;

      if (uncompressed) {
        output[fileName] = decoder.decode(uncompressed);
      }
    }

    offset = dataEnd;
  }

  return output;
}

function extractTextFromWordXml(xml: string): string {
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function readUInt16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  const stream = new Blob([arrayBuffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const response = new Response(stream);
  return new Uint8Array(await response.arrayBuffer());
}

function normalizeResumeText(text: string): string {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[•●▪◦]/g, "\n- ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractResumeSections(text: string): Record<string, string> {
  const lines = text.split("\n");
  const sections: Record<string, string[]> = {
    preamble: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
    projects: [],
    hackathons: [],
  };

  let current = "preamble";
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const next = matchResumeSectionHeader(line);
    if (next) {
      current = next;
      continue;
    }
    sections[current].push(rawLine);
  }

  return Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, value.join("\n").trim()])
  );
}

function matchResumeSectionHeader(line: string): string {
  const normalized = String(line || "")
    .replace(/^[^a-z0-9]+/i, "")
    .replace(/[^a-z0-9]+$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "";
  if (/^(summary|professional summary|profile|about)$/i.test(normalized)) return "summary";
  if (/^(experience|work experience|professional experience|employment history)$/i.test(normalized)) return "experience";
  if (/^(skills|technical skills|core competencies|technologies)$/i.test(normalized)) return "skills";
  if (/^(education|educational background|academic background|academic profile|academic qualifications?|academics?|qualifications?)$/i.test(normalized)) return "education";
  if (/^(projects|personal projects)$/i.test(normalized)) return "projects";
  if (/^(hackathons|awards?)$/i.test(normalized)) return "hackathons";
  return "";
}

function splitSectionLines(text: string): string[] {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePersonalInfo(lines: string[]) {
  const text = lines.join("\n");
  const emails = [...new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
  const compactText = compactResumeContactText(text);
  const links = [
    extractProfileUrl(compactText, "linkedin"),
    extractProfileUrl(compactText, "github"),
  ].filter(Boolean);
  const phoneRegex = /(?:\+?\d{1,3}[\s.-]*)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]*\d{3,4}[\s.-]*\d{4,5}|\b\d{10,12}\b/g;
  const phones = [...new Set((text.match(phoneRegex) || []).map((value) => formatPhoneNumber(value)).filter(Boolean))];
  const fullName = detectName(lines);

  return {
    full_name: fullName,
    first_name: fullName ? fullName.split(/\s+/)[0] || "" : "",
    last_name: fullName ? fullName.split(/\s+/).slice(1).join(" ") : "",
    email: emails[0] || "",
    phone: phones[0] || "",
    linkedin: links.find((link) => /linkedin\.com/i.test(link)) || "",
    github: links.find((link) => /github\.com/i.test(link)) || "",
  };
}

function compactResumeContactText(text: string): string {
  return String(text || "")
    .replace(/\s*([/:.()_-])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function extractProfileUrl(text: string, type: "linkedin" | "github"): string {
  const domain = type === "linkedin" ? "linkedin\\.com" : "github\\.com";
  const match = String(text || "").match(new RegExp(`((?:https?:\\/\\/)?(?:www\\.)?${domain}[^\\s,;]*)`, "i"));
  if (!match) return "";
  const raw = match[1].replace(/[)>.,]+$/g, "");
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function detectName(lines: string[]): string {
  const blacklist = new Set([
    "software", "engineer", "developer", "manager", "data", "scientist", "analyst",
    "product", "designer", "intern", "new", "york", "san", "francisco", "remote",
    "hybrid", "onsite", "resume", "cv", "curriculum", "vitae", "portfolio", "student",
    "bachelor", "master", "phd", "computer", "science", "information", "technology",
    "address", "phone", "email", "mobile", "github", "linkedin", "website", "page",
  ]);

  for (const line of lines.slice(0, 15)) {
    let value = line;
    value = value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, " ");
    value = value.replace(/https?:\/\/[^\s]+/gi, " ");
    value = value.replace(/\b(?:github\.com|linkedin\.com)[^\s]*/gi, " ");
    value = value.replace(/\b(github|linkedin|portfolio|email|phone)\b/gi, " ");
    value = value.replace(/(?:\+?\d{1,3}[\s.-]*)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]*\d{3,4}[\s.-]*\d{4,5}|\b\d{10,12}\b/g, " ");
    value = value.replace(/[^a-zA-Z\s.-]/g, " ").replace(/\s+/g, " ").trim();

    if (!value || value.length > 60) continue;
    if (/^(summary|experience|education|skills|projects|contact)$/i.test(value)) continue;

    const words = value.split(/\s+/).filter(Boolean);
    for (let i = 0; i <= words.length - 2; i += 1) {
      for (let j = 2; j <= 4 && i + j <= words.length; j += 1) {
        const slice = words.slice(i, i + j);
        if (slice.every((word) => /^[A-Z][a-zA-Z'.-]*$/.test(word) && !blacklist.has(word.toLowerCase()))) {
          return slice.join(" ");
        }
      }
    }
  }
  return "";
}

function parseSkillsSection(lines: string[]): string[] {
  if (!lines.length) return [];

  const knownSkills = new Set([
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "ruby", "php", "swift", "kotlin",
    "react", "next.js", "node.js", "express", "vue", "angular", "svelte", "html", "css", "tailwind",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "github actions",
    "postgresql", "mysql", "mongodb", "redis", "dynamodb", "graphql", "rest api", "rest", "microservices",
    "machine learning", "deep learning", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy",
    "spark", "hadoop", "airflow", "linux", "git", "figma", "tableau", "power bi", "snowflake",
    "databricks", "selenium", "playwright", "jest", "cypress", "react native", "android", "ios",
  ]);
  const genericWords = new Set([
    "system", "new", "using", "time", "team", "project", "projects", "application", "applications",
    "development", "software", "tools", "tool", "work", "used", "build", "built", "user", "users",
    "business", "data", "services", "service", "platform", "analysis", "support",
  ]);
  const parsed: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-*]\s*/, "").trim();
    if (!line) continue;
    const skillBody = line.includes(":") ? line.split(":").slice(1).join(":") : line;
    const tokens = skillBody.split(/[,|]+/);

    for (const token of tokens) {
      const cleaned = cleanResumeField(token);
      const lower = cleaned.toLowerCase();
      if (!cleaned || cleaned.length < 3 || cleaned.length > 40) continue;
      if (genericWords.has(lower)) continue;
      if (/^[a-z ]+$/.test(cleaned) && !knownSkills.has(lower)) continue;
      if (!looksLikeSkill(cleaned, knownSkills)) continue;
      parsed.push(cleaned);
    }
  }

  return dedupeList(parsed).slice(0, 40);
}

function parseEducationSection(lines: string[]): EducationEntry[] {
  if (!lines.length) return [];
  const DEGREE_RE = /\b(bachelor|master|phd|ph\.d|associate|mba|m\.b\.a|degree|b\.s|m\.s|b\.tech|m\.tech|b\.e|m\.e|b\.a|m\.a|minor|high school|ged|doctorate|juris)\b/i;
  const entries: EducationEntry[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Skip pure location lines emitted by the two-column PDF splitter (e.g. "New York, US")
    if (looksLikeLocation(line) && !/\b(university|college|school|institute|academy|bachelor|master|phd|associate|mba)\b/i.test(line)) continue;

    // Split by ", " first; fall back to ". " if no commas found
    const raw = line.includes(", ") ? line.split(", ") : line.split(". ");
    const segments = raw.map((s) => s.trim()).filter(Boolean);

    let school = "";
    let degree_level = "";
    let discipline = "";
    let gpa = "";
    let start_year = "";
    let end_year = "";

    for (const seg of segments) {
      // Date range check
      const dr = extractDateRangeFromHeader(seg);
      if (dr.matched) {
        start_year = start_year || extractYear(dr.startDate);
        end_year = end_year || extractYear(dr.endDate);
        continue;
      }

      // GPA: bare decimal like "3.6" or explicit "GPA: 3.8"
      if (/\b(?:gpa[:\s]*)?[0-4]\.\d{1,2}\b/i.test(seg) && !/\b(19|20)\d{2}\b/.test(seg)) {
        gpa = gpa || (extractGpa(seg) || "");
        if (gpa) continue;
      }

      // Degree keyword → degree_level + discipline
      if (DEGREE_RE.test(seg)) {
        if (!degree_level) {
          degree_level = migrateDegreeLevel(seg);
          discipline = discipline || migrateDiscipline(seg) || inferDiscipline(seg);
        }
        continue;
      }

      // Everything else → school name (first candidate wins)
      if (!school && seg.length > 2) {
        school = cleanResumeField(seg);
      }
    }

    // Fallback: pull date/GPA from the full line if still missing
    if (!start_year && !end_year) {
      const dr = extractDateRangeFromHeader(line);
      if (dr.matched) {
        start_year = extractYear(dr.startDate);
        end_year = extractYear(dr.endDate);
      }
    }
    if (!gpa) gpa = extractGpa(line);

    // If no school extracted from segments, strip known patterns from full line
    if (!school) {
      const stripped = cleanResumeField(
        line
          .replace(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}/gi, "")
          .replace(/\b(19|20)\d{2}\b/g, "")
          .replace(/\b[0-4]\.\d{1,2}\b/g, "")
          .replace(/\s*[-–—~_]\s*/g, " ")
          .replace(DEGREE_RE, "")
          .replace(/\s+/g, " ")
      );
      school = stripped;
    }

    if (!school && !degree_level) continue;
    entries.push({ school, degree_level, discipline, gpa, start_year, end_year });
  }

  return dedupeObjects(entries, (e) =>
    `${e.school}|${e.degree_level}|${e.discipline}|${e.start_year}|${e.end_year}`
  ).slice(0, 6);
}

function parseExperienceSection(experienceText: string): WorkEntry[] {
  if (!String(experienceText || "").trim()) return [];
  const safeText = removeTrailingSections(experienceText);
  const jobsRaw = splitJobs(safeText);
  const jobs = jobsRaw.map(parseJobDetails).filter(Boolean) as WorkEntry[];
  return dedupeObjects(jobs, (entry) => `${entry.company}|${entry.role}|${entry.start_date}|${entry.end_date}`).slice(0, 10);
}


function removeTrailingSections(text: string): string {
  const lines = String(text || "").split("\n");
  const kept: string[] = [];
  for (const rawLine of lines) {
    if (isHardStopSectionHeader(rawLine.trim())) break;
    kept.push(rawLine);
  }
  return kept.join("\n").trim();
}

function splitJobs(experienceText: string): string[][] {
  const lines = String(experienceText || "").split("\n").map((line) => line.trim());
  const headerIndices: number[] = [];
  const jobs: string[][] = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (isHardStopSectionHeader(lines[i])) break;
    const dateMatch = extractDateRangeFromHeader(lines[i]);
    if (dateMatch.matched && !lines[i].startsWith("-") && lines[i].length < 150) {
      headerIndices.push(i);
    }
  }

  if (headerIndices.length === 0) {
    const text = removeTrailingSections(experienceText);
    return text ? [text.split("\n")] : [];
  }

  const jobBoundaries: number[] = [];
  for (let i = 0; i < headerIndices.length; i += 1) {
    const dateIdx = headerIndices[i];
    let startIdx = dateIdx;
    const prevIdx = i > 0 ? headerIndices[i - 1] : -1;
    for (let j = dateIdx - 1; j >= Math.max(prevIdx + 1, dateIdx - 3); j -= 1) {
      const line = lines[j];
      if (!line || line.startsWith("-") || line.length > 100 || /^[a-z]/.test(line)) break;
      if (line.endsWith(".") && line.split(/\s+/).length > 8) break;
      startIdx = j;
    }
    jobBoundaries.push(startIdx);
  }

  for (let i = 0; i < jobBoundaries.length; i += 1) {
    const startIdx = jobBoundaries[i];
    const endIdx = i < jobBoundaries.length - 1 ? jobBoundaries[i + 1] : lines.length;
    const jobLines: string[] = [];
    for (let j = startIdx; j < endIdx; j += 1) {
      if (isHardStopSectionHeader(lines[j])) break;
      jobLines.push(lines[j]);
    }
    jobs.push(jobLines);
  }

  return jobs;
}

function isHardStopSectionHeader(line: string): boolean {
  const section = matchResumeSectionHeader(line);
  return !!section && section !== "experience";
}

function parseJobDetails(jobLines: string[]): WorkEntry | null {
  const lines = jobLines.map((line) => line.trim()).filter((line, idx, arr) => line || idx < arr.length - 1);
  if (!lines.length) return null;

  const headerIndex = lines.findIndex((line) => extractDateRangeFromHeader(line).matched);
  if (headerIndex === -1) return null;
  const headerLine = lines[headerIndex];
  const dateRange = extractDateRangeFromHeader(headerLine);
  if (!dateRange.matched) return null;

  const contextBefore = lines.slice(Math.max(0, headerIndex - 3), headerIndex).filter(Boolean);
  const contextAfter = lines.slice(headerIndex + 1, headerIndex + 4).filter(Boolean);
  const roleLine = determineRoleLine(headerLine, contextBefore, contextAfter);
  const companyLine = determineCompanyLine(roleLine, contextBefore, contextAfter);
  const locationLine = determineLocationLine(contextBefore, contextAfter);

  const role = cleanResumeField(stripDateRange(roleLine || headerLine));
  const location = cleanResumeField(locationLine);
  let companyRaw = cleanResumeField(companyLine);
  if (companyRaw && location && companyRaw !== location && companyRaw.includes(location)) {
    companyRaw = companyRaw.replace(location, "").trim();
  }
  const company = companyRaw.replace(/[,|–-]\s*$/, "").trim();

  let descriptionStart = headerIndex + 1;
  const skipLines = new Set([roleLine, companyLine, locationLine]);
  while (descriptionStart < lines.length) {
    const line = lines[descriptionStart];
    if (skipLines.has(line) && !line.startsWith("-")) {
      descriptionStart += 1;
    } else {
      break;
    }
  }

  const description = lines.slice(descriptionStart).join("\n").trim();
  if (!company || !role || !dateRange.startDate || !dateRange.endDate) return null;

  return {
    company,
    role,
    description,
    start_date: dateRange.startDate,
    end_date: dateRange.endDate,
  };
}

function extractDateRangeFromHeader(text: string): { matched: boolean; startDate: string; endDate: string } {
  const month = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const token = `(?:${month}\\s+\\d{4}|\\d{4}|Present|Current)`;
  const pattern = new RegExp(`(${token})\\s*(?:[-–—\\u2212~_]|to)\\s*(${token})`, "i");
  const match = String(text || "").match(pattern);
  if (!match) return { matched: false, startDate: "", endDate: "" };
  return {
    matched: true,
    startDate: normalizeMonthToken(cleanResumeField(match[1])),
    endDate: normalizeMonthToken(cleanResumeField(match[2])),
  };
}

function stripDateRange(text: string): string {
  return cleanResumeField(String(text || "").replace(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\s+\d{4}\s*(?:[-–—\u2212~_]|to)\s*(Present|Current|(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\s+\d{4}|\d{4})/i, ""));
}

function determineRoleLine(headerLine: string, beforeLines: string[], afterLines: string[]): string {
  const strippedHeader = stripDateRange(headerLine);
  if (strippedHeader) return headerLine;
  const candidates = [...beforeLines].reverse().concat(afterLines);
  return candidates.find((line) => !looksLikeLocation(line) && !extractDateRangeFromHeader(line).matched) || headerLine;
}

function determineCompanyLine(roleLine: string, beforeLines: string[], afterLines: string[]): string {
  const candidates = [...beforeLines].reverse().concat(afterLines);
  return (
    candidates.find((line) =>
      line &&
      line !== roleLine &&
      !line.startsWith("-") &&
      !looksLikeLocation(line) &&
      !extractDateRangeFromHeader(line).matched
    ) ||
    candidates.find((line) => line && line !== roleLine && !line.startsWith("-") && !extractDateRangeFromHeader(line).matched) ||
    ""
  );
}

function determineLocationLine(beforeLines: string[], afterLines: string[]): string {
  return [...beforeLines].reverse().concat(afterLines).find((line) => looksLikeLocation(line)) || "";
}

function normalizeMonthToken(value: string): string {
  return String(value || "")
    .replace(/^September\b/i, "Sep")
    .replace(/^Sept\b/i, "Sep")
    .replace(/^Current\b/i, "Present");
}

function looksLikeLocation(line: string): boolean {
  return /^[A-Z][A-Za-z .'-]+,\s*[A-Z]{2,}|Remote|Hybrid|Onsite|On-site/i.test(String(line || "").trim());
}

function formatPhoneNumber(value: string): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const normalized = digits.slice(1);
    return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 10) return `+${digits}`;
  return value.trim();
}

function looksLikeSkill(value: string, knownSkills: Set<string>): boolean {
  const lower = value.toLowerCase();
  if (knownSkills.has(lower)) return true;
  if (/[A-Z]{2,}/.test(value)) return true;
  if (/[+#.]/.test(value)) return true;
  if (/\b(api|sql|aws|react|node|docker|kubernetes|java|python|javascript|typescript|cloud|linux|git)\b/i.test(value)) return true;
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(value)) return true;
  return false;
}

function extractYear(value: string): string {
  return String(value || "").match(/\b(19|20)\d{2}\b/)?.[0] || "";
}

function inferDiscipline(text: string): string {
  const lower = String(text || "").toLowerCase();
  return DISCIPLINES.find((item) => lower.includes(item.toLowerCase())) || "";
}

function extractGpa(text: string): string {
  return text.match(/\b(?:gpa[:\s]*)?([0-4]\.\d{1,2})\b/i)?.[1] || "";
}

function cleanResumeField(value: string): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function dedupeList(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const cleaned = cleanResumeField(item);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}

function dedupeObjects<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item).toLowerCase();
    if (!key.replace(/\|/g, "").trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function migrateDegreeLevel(deg: string): string {
  if (!deg) return "";
  const d = deg.toLowerCase();
  if (/\bhigh school|\bsecondary|\bged\b/.test(d)) return "High School Diploma / GED";
  if (/\bassociate/.test(d)) return "Associate's Degree";
  if (/\bb\.?\s*[sa]\.?\b|\bbachelor/.test(d)) return "Bachelor's Degree";
  if (/\bmba\b|\bm\.?\s*b\.?\s*a\.?\b/.test(d)) return "Master of Business Administration (MBA)";
  if (/\bm\.?\s*[sae]\.?\b|\bmaster/.test(d)) return "Master's Degree";
  if (/\bph\.?\s*d\.?\b|\bdoctor.{0,8}phil|\bdoctorate/.test(d)) return "Doctor of Philosophy (PhD)";
  if (/\bm\.?\s*d\.?\b|\bdoctor.{0,8}med/.test(d)) return "Doctor of Medicine (MD)";
  if (/\bj\.?\s*d\.?\b|\bjuris/.test(d)) return "Juris Doctor (JD)";
  return "";
}

function migrateDiscipline(deg: string): string {
  if (!deg) return "";
  const inMatch = deg.match(/\bin\s+(.+)$/i);
  if (inMatch) return inMatch[1].trim();
  const abbrevMatch = deg.match(/^[A-Z][A-Za-z.]{0,7}\.\s+(.+)$/);
  if (abbrevMatch) return abbrevMatch[1].trim();
  const commaMatch = deg.match(/,\s*(.+)$/);
  if (commaMatch) return commaMatch[1].trim();
  return "";
}
