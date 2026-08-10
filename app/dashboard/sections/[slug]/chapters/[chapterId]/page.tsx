import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";
import { requireUser } from "@/app/data/user/require-user";
import { redirect } from "next/navigation";
import { getUserLockedContent, isLocked } from "@/app/data/user/check-access";

interface iAppProps {
  params: Promise<{ slug: string; chapterId: string }>;
}

export default async function CourseSlugRoute({ params }: iAppProps) {
  const { slug, chapterId } = await params; // await first
  const session = await requireUser();

  const courseData = await getCourseSidebarData(slug, session.user.id);
  
  const userLocks = await getUserLockedContent(session.user.id);

  if (courseData.course?.id && isLocked(userLocks, courseData.course.id, "SECTION")) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have access to this course.</p>
      </div>
    );
  }

  if (isLocked(userLocks, chapterId, "CHAPTER")) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-bold mb-2 text-rose-500">🔒 Chapter Locked</h2>
        <p className="text-muted-foreground">This chapter has been locked by the administrator.</p>
      </div>
    );
  }

  // Find the current chapter by chapterId
  const currentChapter = courseData.course?.chapters.find(
    (c) => c.id === chapterId
  );

  // Filter topics based on locks
  const availableTopics = currentChapter?.topics.filter(t => !isLocked(userLocks, t.id, "TOPIC")) || [];

  // 🔹 Only get lessons from unlocked topics that have lessons, and filter locked lessons
  const lessons = availableTopics
    .filter((t) => t.lessons.length > 0)
    .flatMap((t) => t.lessons.filter(l => !isLocked(userLocks, l.id, "LESSON")));

  const firstLesson = lessons?.[0];

  if (firstLesson) {
    // Redirect to the first lesson of this chapter
    redirect(
      `/dashboard/sections/${slug}/chapters/${chapterId}/${firstLesson.id}`
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-center">
      <h2 className="text-2xl font-bold mb-2">No Lessons Available</h2>
      <p className="text-muted-foreground">
        This Chapter Does Not Have any Lessons Yet
      </p>
    </div>
  );
}
