import { z } from "zod";

export const courseStatus = ["Draft", "Published", "Archived"] as const;
export const SectionSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters" }),
  description: z
    .string()
    .min(1, { message: "Description must be at least 1 character long" })
    .max(500, { message: "Description must be at most 500 characters" }),
  fileKey: z.string().min(1, { message: "Thumbnail is required" }),
  slug: z.string().min(3, { message: "Slug is required" }),
  status: z.enum(courseStatus),
  smallDescription: z
    .string()
    .min(3, { message: "Small Description must be at least 3 characters" })
    .max(200, { message: "Small Description must be at most 100 characters" }),
  accessibleUsers: z.array(z.string().email()).optional(),
});

export const enum UserType {
  ADMIN = 1,
  STUDENT = 2,
}

export const enum status {
  Access = 1,
  Restricted = 2,
}

export const StudentSchema = z.object({
  fname: z.string().min(1, "First name is required"),
  lname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"), // Updated to new syntax
  
  user_type_id: z.number().default(2).optional(),  
  status_id: z.number().default(1).optional(),   

  student_type: z.enum(["FREE", "PAID"]),
});

export const chapterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Chapter name must be at least 3 characters long" }),
  courseId: z.string().uuid({ message: "Invalid Course ID" }),
  fileKey: z.string().optional(),
  description: z.string().optional(),
  smallDescription: z.string().optional(),
});

export const lessonSchema = z.object({
  name: z.string().min(3),
  sectionId: z.string().uuid(),
  chapterId: z.string(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  topicId: z.string().optional(),

  lessonType: z.enum(["PDF", "VIDEO"]).optional(),

  videoDuration: z.string().optional(), 
});

export const topicSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Topic title must be at least 3 characters long" })
    .max(100, { message: "Topic title must be at most 100 characters" }),

  chapterId: z.string().min(1, { message: "Invalid Chapter ID" }),
});

export type SectionSchemaType = z.infer<typeof SectionSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;
export type TopicSchemaType = z.infer<typeof topicSchema>;
export type StudentSchemaType = z.infer<typeof StudentSchema>;
