"use client";
import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { BookIcon, CheckCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransition } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";

interface iAppProps {
  data: LessonContentType;
  isLocked?: boolean;
}

/* ------------------------------------------
   PDF PLAYER (OUTSIDE)
------------------------------------------- */
function PDFPlayer({ pdfUrl }: { pdfUrl: string }) {
  if (!pdfUrl || pdfUrl.trim() === "") {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <BookIcon className="size-16 mb-3 text-primary" />
          <p className="text-muted-foreground text-sm">
            This Lesson Does Not Have A PDF
          </p>
        </div>
      </div>
    );
  }

  const match = pdfUrl.match(/\/d\/(.*?)\//);
  const fileId = match ? match[1] : "";

  return (
    <div className="aspect-video rounded-lg overflow-hidden border bg-white">
      {fileId ? (
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          className="w-full h-full border-0"
          allow="autoplay"
        />
      ) : (
        <p className="p-4 text-center text-muted-foreground">
          Invalid PDF URL
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------
   VIDEO PLAYER (OUTSIDE)
------------------------------------------- */
function VideoPlayer({
  thumbnailUrl,
  videoUrl,
}: {
  thumbnailUrl: string;
  videoUrl: string;
}) {
  if (!videoUrl || videoUrl.trim() === "") {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <BookIcon className="size-16 mb-3 text-primary" />
          <p className="text-muted-foreground text-sm">
            This Lesson Does Not Have A Video
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-lg relative overflow-hidden bg-black">
      <iframe
        src={`https://iframe.mediadelivery.net/embed/382750/${videoUrl}?autoplay=false&poster=${thumbnailUrl}`}
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

export function CourseContent({ data, isLocked }: iAppProps) {
  const [Pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        markLessonComplete(data.lesson.id, data.lesson.chapter.section.slug)
      );

      if (error) {
        toast.error("An Unexpected Error Occurred. Please Try Again Later");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col h-full bg-background pl-6 overflow-hidden">

      {/* PLAYER SECTION */}
      <div className="relative rounded-lg overflow-hidden bg-muted/5">
        {/* The actual players blurred out if locked */}
        <div className={cn("transition-all duration-300", isLocked && "blur-xl grayscale-[30%] opacity-50 pointer-events-none")}>
          {data.lesson.lessonType === "PDF" && (
            <PDFPlayer pdfUrl={data.lesson.pdfUrl ?? ""} />
          )}
          {data.lesson.lessonType === "VIDEO" && (
            <VideoPlayer
              thumbnailUrl={data.lesson.thumbnailUrl ?? ""}
              videoUrl={data.lesson.videoUrl ?? ""}
            />
          )}
        </div>

        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="bg-background/70 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl rounded-2xl p-8 flex flex-col items-center max-w-sm text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
                <Lock className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Content Locked</h2>
              <p className="text-muted-foreground text-sm">
                This lesson has been locked by the administrator. You do not have access to view it right now.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* COMPLETE BUTTON */}
      <div className="py-4 border-b">
        {data.lesson.LessonProgress.length > 0 ? (
          <Button
            variant="outline"
            className="bg-green-500/10 text-green-500 hover:text-green-600"
          >
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Completed
          </Button>
        ) : (
          <Button variant="outline" onClick={onSubmit} disabled={Pending || isLocked} className={cn(isLocked && "cursor-not-allowed opacity-50")}>
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Mark as Complete
          </Button>
        )}
      </div>

      {/* TITLE & DESCRIPTION */}
      <div className="py-6 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {data.lesson.title}
        </h1>

        {data.lesson.description && (
          <RenderDescription json={JSON.parse(data.lesson.description)} />
        )}
      </div>
    </div>
  );
}
