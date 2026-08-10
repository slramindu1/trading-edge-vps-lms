export interface LessonProgressType {
  id: string;
  LessonId: string;
  completed: boolean;
}

export interface LessonType {
  id: string;
  title: string;
  description: string | null; // NO "?"
  position: number;
  LessonProgress?: LessonProgressType[];
}

export interface ChapterType {
  id: string;
  title: string;
  smallDescription: string | null; // NO "?"
  fileKey: string | null; // NO "?"
  position: number;
  lessons?: LessonType[];
}

export interface SectionType {
  id: string;
  title: string;
  smallDescription: string | null;
  fileKey: string | null;
  slug: string;
  chapters: ChapterType[];
}

export type User = {
  id: string;
  email: string;
  fname: string;
  lname: string;
  user_type_id: number;
  role?: string;
  // Add other fields as needed
};

// Update your session type
export type Session = {
  user: User;
  expires?: string;
};