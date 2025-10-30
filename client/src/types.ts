// src/types.ts
export interface Experience {
  id?: string;
  company?: string;
  role?: string;
  interviewDate?: any; // Firestore Timestamp | string | Date
  date?: any;
  createdAt?: any; // Firestore Timestamp
  interviewType?: string;
  difficulty?: number | string;
  outcome?: string;
  content?: string;
  preparationTip?: string;
  upvotes?: number;
  downvotes?: number;
  comments?: number;
  author?: string;
  companyLogo?: string;
  votes?: Record<string, "upvote" | "downvote" | null>;
}

export type Post = Experience;
