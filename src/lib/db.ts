import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // 0-indexed index of options
}

export interface Quiz {
  id: string;
  title: string;
  duration: number; // in minutes (0/null = unlimited)
  questions: Question[];
  createdAt: string;
  startDate?: string;
  endDate?: string;
  creatorId?: string; // Links quiz to its admin creator ("physics" or "math")
}

export interface Submission {
  id: string;
  quizId: string;
  studentName: string;
  rollNumber: string;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  score: number;
  totalQuestions: number;
  startedAt: string;
  submittedAt: string;
  completedInSeconds: number;
}

export interface StudentSession {
  id: string;
  quizId: string;
  studentName: string;
  rollNumber: string;
  startedAt: string;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
}

interface DatabaseSchema {
  quizzes: Quiz[];
  submissions: Submission[];
  sessions: StudentSession[];
  admins: AdminUser[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

// Initialize Supabase if env variables are present
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Ensure DB directory and file exist (for local fallback)
function initializeLocalDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initialData: DatabaseSchema = { quizzes: [], submissions: [], sessions: [], admins: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readLocalDb(): DatabaseSchema {
  initializeLocalDb();
  try {
    const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    // Ensure sessions and admins arrays are present for older local db files
    if (!parsed.sessions) {
      parsed.sessions = [];
    }
    if (!parsed.admins) {
      parsed.admins = [];
    }
    return parsed as DatabaseSchema;
  } catch (error) {
    console.error('Error reading database file:', error);
    return { quizzes: [], submissions: [], sessions: [], admins: [] };
  }
}

function writeLocalDb(data: DatabaseSchema): void {
  initializeLocalDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

// Unified Database Helpers (Asynchronous)

export async function getQuizzes(creatorId?: string): Promise<Quiz[]> {
  if (supabase) {
    let query = supabase.from('quizzes').select('*');
    if (creatorId) {
      query = query.eq('creatorId', creatorId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching quizzes from Supabase:', error);
      return [];
    }
    return data || [];
  } else {
    const db = readLocalDb();
    if (creatorId) {
      return db.quizzes.filter((q) => q.creatorId === creatorId);
    }
    return db.quizzes;
  }
}

export async function getQuiz(id: string): Promise<Quiz | undefined> {
  if (supabase) {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error(`Error fetching quiz ${id} from Supabase:`, error);
      return undefined;
    }
    return data || undefined;
  } else {
    const db = readLocalDb();
    return db.quizzes.find((q) => q.id === id);
  }
}

export async function saveQuiz(quiz: Quiz): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('quizzes')
      .insert([quiz]);
    if (error) {
      console.error('Error saving quiz to Supabase:', error);
      throw new Error(error.message);
    }
  } else {
    const db = readLocalDb();
    db.quizzes.push(quiz);
    writeLocalDb(db);
  }
}

export async function deleteQuiz(id: string): Promise<boolean> {
  if (supabase) {
    // Submissions and Sessions tables have foreign key delete cascade,
    // so deleting the quiz will delete responses and active attempts
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);
    if (error) {
      console.error(`Error deleting quiz ${id} from Supabase:`, error);
      return false;
    }
    return true;
  } else {
    const db = readLocalDb();
    const index = db.quizzes.findIndex((q) => q.id === id);
    if (index !== -1) {
      db.quizzes.splice(index, 1);
      // Clean up local submissions and sessions
      db.submissions = db.submissions.filter((s) => s.quizId !== id);
      db.sessions = db.sessions.filter((s) => s.quizId !== id);
      writeLocalDb(db);
      return true;
    }
    return false;
  }
}

export async function getSubmissions(quizId: string): Promise<Submission[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('quizId', quizId);
    if (error) {
      console.error(`Error fetching submissions for quiz ${quizId} from Supabase:`, error);
      return [];
    }
    return data || [];
  } else {
    const db = readLocalDb();
    return db.submissions.filter((s) => s.quizId === quizId);
  }
}

export async function saveSubmission(submission: Submission): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('submissions')
      .insert([submission]);
    if (error) {
      console.error('Error saving submission to Supabase:', error);
      throw new Error(error.message);
    }
  } else {
    const db = readLocalDb();
    db.submissions.push(submission);
    writeLocalDb(db);
  }
}

// Student Attempts/Sessions Helpers (Anti-Cheat)

export async function createSession(session: StudentSession): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('sessions')
      .insert([session]);
    if (error) {
      console.error('Error creating session in Supabase:', error);
      throw new Error(error.message);
    }
  } else {
    const db = readLocalDb();
    db.sessions.push(session);
    writeLocalDb(db);
  }
}

export async function getSession(id: string): Promise<StudentSession | undefined> {
  if (supabase) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error(`Error fetching session ${id} from Supabase:`, error);
      return undefined;
    }
    return data || undefined;
  } else {
    const db = readLocalDb();
    return db.sessions.find((s) => s.id === id);
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    if (error) {
      console.error(`Error deleting session ${id} from Supabase:`, error);
      return false;
    }
    return true;
  } else {
    const db = readLocalDb();
    const index = db.sessions.findIndex((s) => s.id === id);
    if (index !== -1) {
      db.sessions.splice(index, 1);
      writeLocalDb(db);
      return true;
    }
    return false;
  }
}

export async function hasStudentSubmitted(quizId: string, rollNumber: string): Promise<boolean> {
  if (supabase) {
    const { data, error } = await supabase
      .from('submissions')
      .select('id')
      .eq('quizId', quizId)
      .eq('rollNumber', rollNumber.trim());
    if (error) {
      console.error('Error checking duplicate submission in Supabase:', error);
      return false;
    }
    return !!(data && data.length > 0);
  } else {
    const db = readLocalDb();
    return db.submissions.some(
      (s) => s.quizId === quizId && s.rollNumber.trim().toLowerCase() === rollNumber.trim().toLowerCase()
    );
  }
}

export async function getAdminUser(username: string): Promise<AdminUser | undefined> {
  await initializeDefaultAdmins();
  if (supabase) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (error) {
      console.error(`Error fetching admin ${username} from Supabase:`, error);
      return undefined;
    }
    return data || undefined;
  } else {
    const db = readLocalDb();
    return db.admins?.find((a) => a.username.toLowerCase() === username.toLowerCase());
  }
}

export async function updateAdminPassword(username: string, newPasswordHash: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase
      .from('admins')
      .update({ passwordHash: newPasswordHash })
      .eq('username', username);
    if (error) {
      console.error(`Error updating admin password in Supabase:`, error);
      return false;
    }
    return true;
  } else {
    const db = readLocalDb();
    if (!db.admins) db.admins = [];
    const admin = db.admins.find((a) => a.username.toLowerCase() === username.toLowerCase());
    if (admin) {
      admin.passwordHash = newPasswordHash;
      writeLocalDb(db);
      return true;
    }
    return false;
  }
}

let adminsInitialized = false;

export async function initializeDefaultAdmins(): Promise<void> {
  if (adminsInitialized) return;
  adminsInitialized = true;

  if (supabase) {
    const defaultAdmins = [
      { username: 'physics', passwordHash: 'SAM29@' },
      { username: 'math', passwordHash: 'SAM30@' }
    ];
    for (const admin of defaultAdmins) {
      const { data } = await supabase
        .from('admins')
        .select('username')
        .eq('username', admin.username)
        .maybeSingle();
      if (!data) {
        const { error } = await supabase
          .from('admins')
          .insert([admin]);
        if (error) {
          console.error(`Error seeding admin ${admin.username}:`, error);
        }
      }
    }
  } else {
    const db = readLocalDb();
    if (!db.admins) {
      db.admins = [];
    }
    const hasPhysics = db.admins.some((a) => a.username === 'physics');
    if (!hasPhysics) {
      db.admins.push({ username: 'physics', passwordHash: 'SAM29@' });
    }
    const hasMath = db.admins.some((a) => a.username === 'math');
    if (!hasMath) {
      db.admins.push({ username: 'math', passwordHash: 'SAM30@' });
    }
    writeLocalDb(db);
  }
}
