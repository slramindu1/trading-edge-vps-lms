import { ReactNode } from "react";
import { CourseSidebar } from "../../../../_components/CourseSidebar";
import { getChapterData } from "@/app/data/course/get-chapter-data";

interface iAppProps {
  params: Promise<{ slug: string; chapterId: string }>;
  children: ReactNode;
}

export default async function ChapterLayout({ children, params }: iAppProps) {
  // Await the params promise
  const resolvedParams = await params;
  const { chapterId } = resolvedParams;

  const chapter = await getChapterData(chapterId);

  if (!chapter) return <div>Chapter Not Found</div>;

  // Map topics into chapters for sidebar
  const chapterForSidebar = chapter.topics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    position: topic.position,
    isLocked: false,
    lessons: topic.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      position: lesson.position,
      description: lesson.description,
      videoUrl: lesson.videoUrl || null,
      pdfUrl: lesson.pdfUrl || null,
      lessonType: lesson.lessonType || null,
      videoDuration: lesson.videoDuration || null,
      LessonProgress: lesson.LessonProgress,
      isLocked: false,
    })),
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-90 border-r border-border shrink-0 h-full overflow-y-auto overscroll-contain sidebar-scrollbar">
        <CourseSidebar
          course={{
            id: chapter.section.id,
            title: chapter.section.title,
            fileKey: "", // optional
            slug: chapter.section.slug,
            isLocked: false,
            chapters: [
              {
                id: chapter.id,
                title: chapter.title,
                position: chapter.position,
                isLocked: false,
                topics: chapterForSidebar, // <-- pass topics here
              },
            ],
          }}
        />
      </div>
      <div className="flex-1 h-full overflow-hidden">{children}</div>
    </div>
  );
}
