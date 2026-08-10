import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface ShareRedirectPageProps {
  params: {
    lessonId: string;
  };
}

export default async function ShareRedirectPage({ params }: ShareRedirectPageProps) {
  const { lessonId } = params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: {
        include: {
          section: true,
        },
      },
    },
  });

  if (!lesson) {
    redirect("/404");
  }

  const chapterId = lesson.chapter.id;
  const courseId = lesson.chapter.section.id;

  redirect(`/student/courses/${courseId}/${chapterId}/${lesson.id}`);
}
