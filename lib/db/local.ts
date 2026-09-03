/**
 * 로컬 파일 저장소. Supabase 설정이 없을 때 사용합니다.
 * data/db.json 에 모든 데이터를, public/uploads 에 사진을 저장합니다.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DB, Pledge, PledgeResult, Project, ProjectWithStats, Settings, Student } from "./types";
import { DEFAULT_SETTINGS, normalizeProject } from "./types";

type Data = { students: Student[]; projects: Project[]; pledges: Pledge[]; settings: Settings };

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function load(): Data {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const d = JSON.parse(raw) as Partial<Data>;
    return {
      students: d.students ?? [],
      projects: (d.projects ?? []).map(normalizeProject),
      pledges: d.pledges ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
    };
  } catch {
    return { students: [], projects: [], pledges: [], settings: { ...DEFAULT_SETTINGS } };
  }
}

function save(d: Data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

function withStats(d: Data, p: Project): ProjectWithStats {
  const mine = d.pledges.filter((x) => x.project_id === p.id);
  const raised = mine.reduce((s, x) => s + x.amount, 0);
  const backers = new Set(mine.map((x) => x.student_id)).size;
  return { ...p, raised, backers };
}

function byStudent(a: Student, b: Student) {
  return a.grade - b.grade || a.class - b.class || a.number - b.number;
}

export const localDb: DB = {
  async getStudent(id) {
    return load().students.find((s) => s.id === id) ?? null;
  },
  async listStudents() {
    return load().students.slice().sort(byStudent);
  },
  async createStudents(rows) {
    const d = load();
    const existing = new Set(d.students.map((s) => s.id));
    let created = 0;
    let skipped = 0;
    const now = new Date().toISOString();
    for (const r of rows) {
      if (existing.has(r.id)) {
        skipped++;
        continue;
      }
      d.students.push({ ...r, created_at: now });
      existing.add(r.id);
      created++;
    }
    save(d);
    return { created, skipped };
  },
  async deleteStudents(filter) {
    const d = load();
    const match = (s: Student) =>
      (filter.grade === undefined || s.grade === filter.grade) &&
      (filter.class === undefined || s.class === filter.class);
    const removed = new Set(d.students.filter(match).map((s) => s.id));
    d.students = d.students.filter((s) => !removed.has(s.id));
    d.pledges = d.pledges.filter((p) => !removed.has(p.student_id));
    save(d);
    return removed.size;
  },

  async listProjects() {
    const d = load();
    return d.projects
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((p) => withStats(d, p));
  },
  async getProject(id) {
    const d = load();
    const p = d.projects.find((x) => x.id === id);
    return p ? withStats(d, p) : null;
  },
  async createProject(input) {
    const d = load();
    const p: Project = { id: randomUUID(), created_at: new Date().toISOString(), ...input };
    d.projects.push(p);
    save(d);
    return p;
  },
  async updateProject(id, patch) {
    const d = load();
    const i = d.projects.findIndex((x) => x.id === id);
    if (i < 0) return;
    d.projects[i] = { ...d.projects[i], ...patch };
    save(d);
  },
  async deleteProject(id) {
    const d = load();
    for (const pl of d.pledges.filter((x) => x.project_id === id)) {
      const s = d.students.find((x) => x.id === pl.student_id);
      if (s) s.balance += pl.amount;
    }
    d.pledges = d.pledges.filter((x) => x.project_id !== id);
    d.projects = d.projects.filter((x) => x.id !== id);
    save(d);
  },

  async listPledges(filter = {}) {
    return load()
      .pledges.filter(
        (p) =>
          (!filter.studentId || p.student_id === filter.studentId) &&
          (!filter.projectId || p.project_id === filter.projectId),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async makePledge(studentId, projectId, amount): Promise<PledgeResult> {
    if (!Number.isInteger(amount) || amount <= 0) return { ok: false, error: "invalid_amount" };
    const d = load();
    if (!d.settings.funding_open) return { ok: false, error: "closed" };
    const p = d.projects.find((x) => x.id === projectId);
    if (!p) return { ok: false, error: "not_found" };
    const s = d.students.find((x) => x.id === studentId);
    if (!s) return { ok: false, error: "no_student" };
    if (s.balance < amount) return { ok: false, error: "insufficient" };
    s.balance -= amount;
    d.pledges.push({
      id: randomUUID(),
      student_id: studentId,
      project_id: projectId,
      amount,
      created_at: new Date().toISOString(),
    });
    save(d);
    return { ok: true, balance: s.balance };
  },
  async cancelPledge(studentId, pledgeId): Promise<PledgeResult> {
    const d = load();
    if (!d.settings.funding_open) return { ok: false, error: "closed" };
    const i = d.pledges.findIndex((x) => x.id === pledgeId && x.student_id === studentId);
    if (i < 0) return { ok: false, error: "not_found" };
    const pl = d.pledges[i];
    const s = d.students.find((x) => x.id === studentId);
    if (!s) return { ok: false, error: "no_student" };
    s.balance += pl.amount;
    d.pledges.splice(i, 1);
    save(d);
    return { ok: true, balance: s.balance };
  },
  async resetPledges(startingBalance) {
    const d = load();
    d.pledges = [];
    for (const s of d.students) s.balance = startingBalance;
    save(d);
  },

  async getSettings() {
    return load().settings;
  },
  async updateSettings(patch) {
    const d = load();
    d.settings = { ...d.settings, ...patch };
    save(d);
    return d.settings;
  },

  async uploadImage(data, _contentType, ext) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), data);
    return `/uploads/${name}`;
  },
};
