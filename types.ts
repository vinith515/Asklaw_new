export interface User {
  _id: string; // MongoDB ObjectId simulation
  username: string;
  email: string;
  passwordHash: string;
  registrationDate: string; // ISO Date
  name: string; // Keeping for UI display compatibility
}

export interface HistoryItem {
  id: string;
  userId: string;
  question: string;
  answer: LegalResponse;
  timestamp: string;
  feedback?: 'helpful' | 'not-helpful';
}

export interface LegalResponse {
  meaning: string;
  options: string[];
  redFlags: string[];
  nextSteps: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface KnowledgeDocument {
  _id: string;
  topic: string;
  content: string;
  keywords: string[];
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE'
}