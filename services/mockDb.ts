import { User, HistoryItem, LegalResponse, KnowledgeDocument } from "../types";

// Keys for localStorage (Simulating MongoDB Collections)
const DB_USERS = 'mongodb_users_collection';
const DB_HISTORY = 'mongodb_history_collection';
const DB_KNOWLEDGE = 'mongodb_knowledge_collection';

// --- Crypto Helpers (Simulating Backend Logic) ---

const generateUUID = (): string => {
  // Robust UUID generator that works in all contexts
  // Use globalThis to safely access crypto in different environments
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.randomUUID) {
    try {
      return globalThis.crypto.randomUUID();
    } catch (e) {
      // Fallback if crypto.randomUUID fails
    }
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const hashPassword = async (password: string): Promise<string> => {
  // Check if subtle crypto is available (only in secure contexts like https or localhost)
  const hasSubtle = typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle;

  if (hasSubtle) {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn("Crypto API failed, falling back to simple hash");
    }
  }
  
  // Fallback for non-secure contexts (simple insecure hash for demo purposes only)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

const generateJWT = (user: User): string => {
  // Simulating a JWT: Header.Payload.Signature
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: user._id, name: user.username, iat: Date.now() }));
  const signature = "simulated_signature_hash"; 
  return `${header}.${payload}.${signature}`;
};

// --- Database Initialization (Seeding Knowledge Base for RAG) ---
const initializeKnowledgeBase = () => {
  if (localStorage.getItem(DB_KNOWLEDGE)) return;

  const knowledgeDocs: KnowledgeDocument[] = [
    {
      _id: "doc_1",
      topic: "Force Majeure",
      content: "Force majeure is a common clause in contracts that essentially frees both parties from liability or obligation when an extraordinary event or circumstance beyond the control of the parties, such as a war, strike, riot, crime, epidemic or an event described by the legal term act of God, prevents one or both parties from fulfilling their obligations under the contract.",
      keywords: ["force majeure", "act of god", "contract", "liability"]
    },
    {
      _id: "doc_2",
      topic: "NDA",
      content: "A non-disclosure agreement (NDA) is a legal contract between at least two parties that outlines confidential material, knowledge, or information that the parties wish to share with one another for certain purposes, but wish to restrict access to. It is a contract through which the parties agree not to disclose information covered by the agreement.",
      keywords: ["nda", "non-disclosure", "confidential", "agreement"]
    },
    {
      _id: "doc_3",
      topic: "Indemnification",
      content: "Indemnification is a contractual obligation of one party to compensate the loss incurred to the other party due to the acts of the indemnitor or any other party. The duty to indemnify is usually, but not always, coextensive with the contractual duty to 'hold harmless' or 'save harmless'.",
      keywords: ["indemnify", "indemnification", "compensate", "loss", "hold harmless"]
    }
  ];
  localStorage.setItem(DB_KNOWLEDGE, JSON.stringify(knowledgeDocs));
};

initializeKnowledgeBase();

// --- Backend Services ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockSignup = async (email: string, password: string, username: string, fullName: string): Promise<{ user: User, token: string }> => {
  await delay(800);
  const usersStr = localStorage.getItem(DB_USERS);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];

  if (users.find((u) => u.email === email || u.username === username)) {
    throw new Error("User with this email or username already exists");
  }

  const passwordHash = await hashPassword(password);

  const newUser: User = {
    _id: generateUUID(),
    username,
    email,
    passwordHash,
    registrationDate: new Date().toISOString(),
    name: fullName // keeping for UI
  };

  users.push(newUser);
  localStorage.setItem(DB_USERS, JSON.stringify(users));

  return {
    user: newUser,
    token: generateJWT(newUser)
  };
};

export const mockLogin = async (email: string, password: string): Promise<{ user: User, token: string }> => {
  await delay(800);
  const usersStr = localStorage.getItem(DB_USERS);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];
  
  const passwordHash = await hashPassword(password);
  const foundUser = users.find(u => u.email === email && u.passwordHash === passwordHash);
  
  if (!foundUser) {
    throw new Error("Invalid credentials");
  }

  return {
    user: foundUser,
    token: generateJWT(foundUser)
  };
};

// --- RAG & History Services ---

export const findRelevantContext = async (query: string): Promise<string> => {
  // Simulating a Vector DB query or Text Search on MongoDB
  const knowledgeStr = localStorage.getItem(DB_KNOWLEDGE);
  const docs: KnowledgeDocument[] = knowledgeStr ? JSON.parse(knowledgeStr) : [];
  
  const queryLower = query.toLowerCase();
  
  // Simple keyword matching for simulation
  const relevantDocs = docs.filter(doc => 
    doc.keywords.some(k => queryLower.includes(k)) || 
    doc.content.toLowerCase().includes(queryLower) ||
    queryLower.includes(doc.topic.toLowerCase())
  );

  if (relevantDocs.length === 0) return "";

  return relevantDocs.map(d => `[Source: ${d.topic}] ${d.content}`).join("\n\n");
};

export const saveHistoryItem = async (userId: string, question: string, answer: LegalResponse): Promise<HistoryItem> => {
  await delay(300);
  const historyStr = localStorage.getItem(DB_HISTORY);
  const history: HistoryItem[] = historyStr ? JSON.parse(historyStr) : [];

  const newItem: HistoryItem = {
    id: generateUUID(),
    userId,
    question,
    answer,
    timestamp: new Date().toISOString(),
  };

  history.unshift(newItem);
  localStorage.setItem(DB_HISTORY, JSON.stringify(history));
  return newItem;
};

export const getUserHistory = async (userId: string): Promise<HistoryItem[]> => {
  await delay(500);
  const historyStr = localStorage.getItem(DB_HISTORY);
  const history: HistoryItem[] = historyStr ? JSON.parse(historyStr) : [];
  return history.filter(h => h.userId === userId);
};

export const getUserStats = async (userId: string) => {
  await delay(300);
  const history = await getUserHistory(userId);
  return {
    totalQuestions: history.length,
    cacheHitRate: Math.floor(Math.random() * 30) + 70,
    avgResponseTime: (Math.random() * 2 + 0.5).toFixed(1)
  };
};