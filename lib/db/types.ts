export type Student = {
  id: string; // "2-3-15" (학년-반-번호)
  grade: number;
  class: number;
  number: number;
  password: string;
  balance: number;
  created_at: string;
};

/** 상품 */
export type Project = {
  id: string;
  title: string; // 상품명
  summary: string; // 홍보 문구
  creator: string; // 제작자
  specs: string; // 상품 정보, 한 줄에 하나 "항목: 내용"
  images: string[]; // 사진 URL 목록 (첫 장이 대표)
  created_at: string;
};

export type ProjectWithStats = Project & { raised: number; backers: number };

export type Pledge = {
  id: string;
  student_id: string;
  project_id: string;
  amount: number;
  reason: string; // 심은 이유
  created_at: string;
};

export type ProjectInput = Omit<Project, "id" | "created_at">;

/** 사이트 전체 설정 */
export type Settings = {
  /** false 이면 펀딩(심기·취소)을 받지 않고 결과만 보여줍니다. */
  funding_open: boolean;
};

export const DEFAULT_SETTINGS: Settings = { funding_open: true };

export type PledgeError = "invalid_amount" | "closed" | "no_student" | "insufficient" | "not_found";

export type PledgeResult = { ok: true; balance: number } | { ok: false; error: PledgeError };

export interface DB {
  getStudent(id: string): Promise<Student | null>;
  listStudents(): Promise<Student[]>;
  /** 이미 있는 아이디는 건너뜁니다. */
  createStudents(rows: Omit<Student, "created_at">[]): Promise<{ created: number; skipped: number }>;
  deleteStudents(filter: { grade?: number; class?: number }): Promise<number>;

  listProjects(): Promise<ProjectWithStats[]>;
  getProject(id: string): Promise<ProjectWithStats | null>;
  createProject(input: ProjectInput): Promise<Project>;
  updateProject(id: string, patch: Partial<ProjectInput>): Promise<void>;
  /** 상품을 지우고, 거기 들어간 새싹은 학생들에게 돌려줍니다. */
  deleteProject(id: string): Promise<void>;

  listPledges(filter?: { studentId?: string; projectId?: string }): Promise<Pledge[]>;
  makePledge(studentId: string, projectId: string, amount: number, reason: string): Promise<PledgeResult>;
  cancelPledge(studentId: string, pledgeId: string): Promise<PledgeResult>;
  /** 모든 펀딩 기록을 지우고 학생 잔액을 시작 자금으로 되돌립니다. */
  resetPledges(startingBalance: number): Promise<void>;

  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  /** 사진을 저장하고 공개 URL을 돌려줍니다. */
  uploadImage(data: Buffer, contentType: string, ext: string): Promise<string>;
}

/** 예전 데이터에 없는 필드를 기본값으로 채웁니다. */
export function normalizeProject(
  raw: Partial<Project> & { image_url?: string | null } & Pick<Project, "id" | "title">,
): Project {
  const images = raw.images ?? (raw.image_url ? [raw.image_url] : []);
  return {
    id: raw.id,
    title: raw.title,
    summary: raw.summary ?? "",
    creator: raw.creator ?? "",
    specs: raw.specs ?? "",
    images,
    created_at: raw.created_at ?? new Date(0).toISOString(),
  };
}

export function normalizePledge(raw: Partial<Pledge> & Omit<Pledge, "reason">): Pledge {
  return { ...raw, reason: raw.reason ?? "" };
}

/** "2-3-15" → { grade: 2, class: 3, number: 15 } */
export function parseStudentId(id: string): { grade: number; class: number; number: number } | null {
  const m = id.match(/^(\d+)-(\d+)-(\d+)$/);
  return m ? { grade: Number(m[1]), class: Number(m[2]), number: Number(m[3]) } : null;
}
