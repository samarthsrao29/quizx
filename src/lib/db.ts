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
}

export interface Submission {
  id: string;
  quizId: string;
  studentName: string;
  studentEmail: string;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  score: number;
  totalQuestions: number;
  startedAt: string;
  submittedAt: string;
  completedInSeconds: number;
}

interface DatabaseSchema {
  quizzes: Quiz[];
  submissions: Submission[];
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
    const initialData: DatabaseSchema = { quizzes: [], submissions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readLocalDb(): DatabaseSchema {
  initializeLocalDb();
  try {
    const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(fileContent) as DatabaseSchema;
  } catch (error) {
    console.error('Error reading database file:', error);
    return { quizzes: [], submissions: [] };
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

export async function getQuizzes(): Promise<Quiz[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*');
    if (error) {
      console.error('Error fetching quizzes from Supabase:', error);
      return [];
    }
    return data || [];
  } else {
    const db = readLocalDb();
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
    // Submissions table has foreign key delete cascade, so deleting the quiz will delete responses
    const { error, count } = await supabase
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
      // Clean up local submissions
      db.submissions = db.submissions.filter((s) => s.quizId !== id);
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
