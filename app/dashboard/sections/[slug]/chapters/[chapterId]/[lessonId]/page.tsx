import { getLessonContent } from "@/app/data/course/get-lesson-content";
import { CourseContent } from "./_components/CourseContent";
import { requireUser } from "@/app/data/user/require-user";
import { getUserLockedContent, isLocked } from "@/app/data/user/check-access";

type Params = Promise<{lessonId:string}>;

export default async function LessonContentPage({params}:{params:Params}){
    const {lessonId} = await params;
    const session = await requireUser();

    const data = await getLessonContent(lessonId);
    const userLocks = await getUserLockedContent(session.user.id);

    const isSectionLocked = isLocked(userLocks, data.lesson.chapter.sectionId, "SECTION");
    const isChapterLocked = isLocked(userLocks, data.lesson.chapterId, "CHAPTER");
    const isTopicLocked = data.lesson.topicId ? isLocked(userLocks, data.lesson.topicId, "TOPIC") : false;
    const isLessonLocked = isLocked(userLocks, data.lesson.id, "LESSON");

    if (isSectionLocked || isChapterLocked || isTopicLocked || isLessonLocked) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)] text-center p-8 bg-muted/10 rounded-xl mt-4">
                <div>
                    <h2 className="text-3xl font-bold mb-4 text-rose-500">🔒 Content Locked</h2>
                    <p className="text-muted-foreground text-lg">This lesson has been locked by the administrator.</p>
                </div>
            </div>
        );
    }

    return(
        <CourseContent data={data}/>
    )
}