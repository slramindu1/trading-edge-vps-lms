"use client";

import { useEffect, useState, useMemo } from "react";
import { getStudentCourseTree, StudentCourseTreeType, getLockedContent, updateLockedContent } from "../actions";
import { Loader2, ChevronRight, ChevronDown, Folder, PlaySquare, BookOpen, ShieldCheck, X, Link as LinkIcon, User as UserIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StudentAccessTreeProps {
  studentId: string;
}

export function StudentAccessTree({ studentId }: StudentAccessTreeProps) {
  const [data, setData] = useState<StudentCourseTreeType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track expanded nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Track granted access
  const [accessGranted, setAccessGranted] = useState<Set<string>>(new Set());

  // Compute all available entity IDs when data loads
  const allEntityIds = useMemo(() => {
    const ids = new Set<string>();
    if (!data) return ids;
    data.enrollments.forEach(enrollment => {
      ids.add(`section_${enrollment.section.id}`);
      enrollment.section.chapters.forEach(chapter => {
        ids.add(`chapter_${chapter.id}`);
        chapter.topics.forEach(topic => {
          ids.add(`topic_${topic.id}`);
          topic.lessons.forEach(lesson => {
            ids.add(`lesson_${lesson.id}`);
          });
        });
      });
    });
    return ids;
  }, [data]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [result, lockedIds] = await Promise.all([
          getStudentCourseTree(studentId),
          getLockedContent(studentId)
        ]);
        
        setData(result);
        
        if (result && result.enrollments.length > 0) {
          setExpandedNodes(new Set([`section_${result.enrollments[0].section.id}`]));
        }

        // Initially, grant access to everything EXCEPT what is in lockedIds
        // We have to wait for allEntityIds to be computed. Since it's a memo, 
        // we can just compute it directly here to be safe for the first load.
        const ids = new Set<string>();
        if (result) {
          result.enrollments.forEach(enrollment => {
            ids.add(`section_${enrollment.section.id}`);
            enrollment.section.chapters.forEach(chapter => {
              ids.add(`chapter_${chapter.id}`);
              chapter.topics.forEach(topic => {
                ids.add(`topic_${topic.id}`);
                topic.lessons.forEach(lesson => {
                  ids.add(`lesson_${lesson.id}`);
                });
              });
            });
          });
        }
        
        lockedIds.forEach(lockedId => {
          ids.delete(lockedId);
        });
        
        setAccessGranted(ids);
        
      } catch (error) {
        console.error("Failed to load student course tree", error);
        toast.error("Failed to load access records");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [studentId]);

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const toggleAccess = (nodeId: string, checked: boolean) => {
    setAccessGranted(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(nodeId);
      } else {
        next.delete(nodeId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find what is locked (in allEntityIds but NOT in accessGranted)
      const lockedIdsToSave = Array.from(allEntityIds).filter(id => !accessGranted.has(id));
      await updateLockedContent(studentId, lockedIdsToSave);
      toast.success("Access control updated successfully");
    } catch (error) {
      console.error("Failed to save", error);
      toast.error("Failed to update access control");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading access records...</p>
      </div>
    );
  }

  if (!data || data.enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <ShieldCheck className="w-10 h-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-base font-semibold">No Enrollments</h3>
        <p className="text-sm text-muted-foreground">This student has no active courses.</p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans max-w-2xl mx-auto">
      
      {/* Top Header - mimicking Untitled UI */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl border shadow-sm bg-background">
            <ShieldCheck className="w-6 h-6 text-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Access Control</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Manage viewing permissions for <span className="font-medium text-foreground">{data.fname} {data.lname}</span>.
        </p>
      </div>

      {/* Dotted Divider */}
      <div className="w-full border-t border-dashed border-border/80 my-6"></div>

      {/* Content Area */}
      <div className="space-y-6">
        {data.enrollments.map((enrollment) => {
          const section = enrollment.section;
          const sectionId = `section_${section.id}`;
          const isSectionExpanded = expandedNodes.has(sectionId);
          const isSectionUnlocked = accessGranted.has(sectionId);

          return (
            <div key={section.id} className="space-y-4">
              
              {/* Course Block (Mimicking the "Anyone with the link can view" block) */}
              <div 
                className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl border border-transparent hover:border-border/50 transition-colors cursor-pointer"
                onClick={(e) => toggleExpand(sectionId, e)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">{section.title}</span>
                    {isSectionExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  <span className="text-sm font-medium text-muted-foreground">
                    {isSectionUnlocked ? "Unlocked" : "Locked"}
                  </span>
                  <div className="p-1.5 hover:bg-muted rounded-md transition-colors">
                    <Checkbox 
                      className="w-4 h-4 rounded-sm"
                      checked={isSectionUnlocked}
                      onCheckedChange={(checked) => toggleAccess(sectionId, checked as boolean)}
                    />
                  </div>
                </div>
              </div>

              {/* Children (Mimicking the "People with access" list) */}
              {isSectionExpanded && (
                <div className="pl-2 pr-1 space-y-1 mt-2">
                  <h3 className="text-xs font-semibold text-foreground mb-3 px-2">Course Contents</h3>
                  
                  {section.chapters.length === 0 ? (
                    <div className="text-sm text-muted-foreground px-2">No chapters available.</div>
                  ) : (
                    section.chapters.map(chapter => {
                      const chapterId = `chapter_${chapter.id}`;
                      const isChapterExpanded = expandedNodes.has(chapterId);
                      const isChapterUnlocked = accessGranted.has(chapterId);

                      return (
                        <div key={chapter.id} className="flex flex-col">
                          {/* Chapter Row */}
                          <div 
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                            onClick={(e) => toggleExpand(chapterId, e)}
                          >
                            <div className="flex items-center gap-3">
                              {/* Avatar-like Icon */}
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0 border border-border/50">
                                {isChapterExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold text-foreground">Chapter {chapter.position}</span>
                                </div>
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{chapter.title}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                {isChapterExpanded ? (
                                  <span className="text-xs text-muted-foreground">Collapse</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Expand</span>
                                )}
                              </div>
                              <Checkbox 
                                className="w-4 h-4 rounded-sm text-foreground"
                                checked={isChapterUnlocked}
                                onCheckedChange={(checked) => toggleAccess(chapterId, checked as boolean)}
                              />
                            </div>
                          </div>

                          {/* Topics & Lessons */}
                          {isChapterExpanded && (
                            <div className="ml-[22px] border-l border-border/60 pl-6 my-2 space-y-1">
                              {chapter.topics.length === 0 ? (
                                <div className="text-xs text-muted-foreground py-2">No topics found.</div>
                              ) : (
                                chapter.topics.map(topic => {
                                  const topicId = `topic_${topic.id}`;
                                  const isTopicExpanded = expandedNodes.has(topicId);
                                  const isTopicUnlocked = accessGranted.has(topicId);

                                  return (
                                    <div key={topic.id} className="flex flex-col mb-2">
                                      {/* Topic Row */}
                                      <div 
                                        className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                                        onClick={(e) => toggleExpand(topicId, e)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center text-muted-foreground shrink-0">
                                            {isTopicExpanded ? (
                                              <ChevronDown className="w-4 h-4" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4" />
                                            )}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground">{topic.title}</span>
                                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Topic</span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                            {isTopicExpanded ? (
                                              <span className="text-xs text-muted-foreground">Collapse</span>
                                            ) : (
                                              <span className="text-xs text-muted-foreground">Expand</span>
                                            )}
                                          </div>
                                          <Checkbox 
                                            className="w-4 h-4 rounded-sm text-foreground"
                                            checked={isTopicUnlocked}
                                            onCheckedChange={(checked) => toggleAccess(topicId, checked as boolean)}
                                          />
                                        </div>
                                      </div>

                                      {/* Lessons */}
                                      {isTopicExpanded && (
                                        <div className="ml-[16px] border-l border-border/40 pl-5 mt-1 space-y-1">
                                          {topic.lessons.length === 0 ? (
                                            <div className="text-xs text-muted-foreground py-1">No lessons.</div>
                                          ) : (
                                            topic.lessons.map(lesson => {
                                              const lessonId = `lesson_${lesson.id}`;
                                              const isLessonUnlocked = accessGranted.has(lessonId);

                                              return (
                                                <div 
                                                  key={lesson.id}
                                                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                                                >
                                                  <div className="flex items-center gap-2.5">
                                                    <PlaySquare className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-sm text-foreground/80">{lesson.title}</span>
                                                  </div>
                                                  <div className="flex items-center gap-3 pr-1">
                                                    <Checkbox 
                                                      className="w-4 h-4 rounded-sm text-foreground"
                                                      checked={isLessonUnlocked}
                                                      onCheckedChange={(checked) => toggleAccess(lessonId, checked as boolean)}
                                                    />
                                                  </div>
                                                </div>
                                              );
                                            })
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              
              {/* Dotted Divider between courses */}
              <div className="w-full border-t border-dashed border-border/80 my-4"></div>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="mt-8 flex items-center justify-between pt-2">
        <Button variant="outline" className="text-sm font-medium">
          Cancel
        </Button>
        <Button 
          className="text-sm font-medium bg-foreground text-background hover:bg-foreground/90 px-6 cursor-pointer"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            "Done"
          )}
        </Button>
      </div>

    </div>
  );
}
