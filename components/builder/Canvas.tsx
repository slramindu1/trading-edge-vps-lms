"use client";
import React, { useRef, useState, useEffect } from "react";
import { useBuilder, BuilderElement } from "./BuilderContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Copy,
  Trash,
  Files,
  ClipboardPaste,
  Lock,
  ArrowUp,
  ArrowDown,
  Pencil,
} from "lucide-react";

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return url; // Uploads live on LMS
  
  let finalUrl = url;
  if (!finalUrl.startsWith("/")) {
    finalUrl = `/assets/${finalUrl}`;
  }

  // Any other local path (like /5.jpg or /assets/...) belongs to the landing page
  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || "https://tradingedgefx.com";
  return `${landingUrl.replace(/\/$/, '')}${finalUrl}`;
};

export function Canvas() {
  const {
    elements,
    selectedElementId,
    setSelectedElementId,
    updateElement,
    canvasW,
    canvasH,
    setCanvasW,
    setCanvasH,
    pasteElement,
    clipboardElement,
    zoom,
    copyElement,
    duplicateElement,
    removeElement,
    pushHistory,
    moveLayerUp,
    moveLayerDown,
  } = useBuilder();
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    show: boolean;
    elementId: string | null;
  }>({ x: 0, y: 0, canvasX: 0, canvasY: 0, show: false, elementId: null });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;

      // Don't nudge if typing in an input
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        
        const selectedEl = elements.find((el) => el.id === selectedElementId);
        if (!selectedEl || selectedEl.locked) return;

        const step = e.shiftKey ? 10 : 1;
        let newX = selectedEl.x;
        let newY = selectedEl.y;

        if (e.key === "ArrowUp") newY -= step;
        if (e.key === "ArrowDown") newY += step;
        if (e.key === "ArrowLeft") newX -= step;
        if (e.key === "ArrowRight") newX += step;

        updateElement(selectedElementId, { x: newX, y: newY });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, elements, updateElement]);

  const handleCanvasResize = (
    e: React.PointerEvent,
    corner: "e" | "s" | "se",
  ) => {
    e.stopPropagation();
    pushHistory();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = canvasW;
    const startH = canvasH;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;

      let newW = startW;
      let newH = startH;

      if (corner === "e" || corner === "se")
        newW = Math.max(200, startW + deltaX);
      if (corner === "s" || corner === "se")
        newH = Math.max(200, startH + deltaY);

      setCanvasW(Math.round(newW));
      setCanvasH(Math.round(newH));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  useEffect(() => {
    const handleClick = () =>
      setContextMenu((prev) => ({ ...prev, show: false }));
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (
    e: React.MouseEvent,
    elementId: string | null = null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      canvasX,
      canvasY,
      show: true,
      elementId,
    });
  };

  const selectedEl = elements.find((e) => e.id === contextMenu.elementId);

  return (
    <div
      ref={wrapperRef}
      className="flex-1 overflow-auto w-full h-full"
      style={{
        background:
          "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 24px 24px",
      }}
    >
      <div
        style={{
          minWidth: "100%",
          minHeight: "100%",
          width: "max-content",
          height: "max-content",
          display: "flex",
          padding: "80px",
        }}
        onClick={() => setSelectedElementId(null)}
      >
        {/* Zoom Wrapper */}
        <div style={{ margin: "auto" }}>
          <div
            ref={canvasRef}
            className="relative bg-background border border-border shadow-2xl group/canvas"
            style={{
              width: canvasW,
              height: canvasH,
              overflow: "visible",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
            onClick={(e) => {
              if (e.target === canvasRef.current) setSelectedElementId(null);
            }}
            onContextMenu={(e) => handleContextMenu(e)}
          >
            {/* Canvas Resize Handles */}
            <div
              className="absolute top-0 -right-3 w-6 h-full cursor-ew-resize opacity-0 group-hover/canvas:opacity-100 flex items-center justify-center z-[60]"
              onPointerDown={(e) => handleCanvasResize(e, "e")}
            >
              <div className="w-1 h-8 bg-primary rounded-full shadow-sm" />
            </div>
            <div
              className="absolute -bottom-3 left-0 w-full h-6 cursor-ns-resize opacity-0 group-hover/canvas:opacity-100 flex items-center justify-center z-[60]"
              onPointerDown={(e) => handleCanvasResize(e, "s")}
            >
              <div className="h-1 w-8 bg-primary rounded-full shadow-sm" />
            </div>
            <div
              className="absolute -bottom-3 -right-3 w-6 h-6 bg-background border-2 border-primary rounded-full cursor-nwse-resize shadow-md flex items-center justify-center opacity-0 group-hover/canvas:opacity-100 transition-opacity z-[70]"
              onPointerDown={(e) => handleCanvasResize(e, "se")}
            />

            {/* Grid lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="grid"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Center crosshairs */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-primary/5 pointer-events-none" />
            <div className="absolute left-0 right-0 top-1/2 h-px bg-primary/5 pointer-events-none" />

            {elements.map((el) => (
              <CanvasElement
                key={el.id}
                element={el}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-popover border border-border shadow-2xl rounded-xl py-1.5 z-[200] w-52 text-sm font-medium backdrop-blur-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.elementId && selectedEl ? (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                {selectedEl.name}
              </div>
              <ContextMenuItem
                icon={<Copy className="w-3.5 h-3.5" />}
                label="Copy"
                shortcut="Ctrl+C"
                onClick={() => {
                  copyElement(contextMenu.elementId!);
                  setContextMenu((p) => ({ ...p, show: false }));
                }}
              />
              <ContextMenuItem
                icon={<Files className="w-3.5 h-3.5" />}
                label="Duplicate"
                shortcut="Ctrl+D"
                onClick={() => {
                  duplicateElement(contextMenu.elementId!);
                  setContextMenu((p) => ({ ...p, show: false }));
                }}
              />
              <div className="h-px bg-border my-1" />
              <ContextMenuItem
                icon={<ArrowUp className="w-3.5 h-3.5" />}
                label="Bring Forward"
                onClick={() => {
                  moveLayerUp(contextMenu.elementId!);
                  setContextMenu((p) => ({ ...p, show: false }));
                }}
              />
              <ContextMenuItem
                icon={<ArrowDown className="w-3.5 h-3.5" />}
                label="Send Backward"
                onClick={() => {
                  moveLayerDown(contextMenu.elementId!);
                  setContextMenu((p) => ({ ...p, show: false }));
                }}
              />
              <div className="h-px bg-border my-1" />
              <ContextMenuItem
                icon={<Trash className="w-3.5 h-3.5" />}
                label="Delete"
                shortcut="Del"
                danger
                onClick={() => {
                  pushHistory();
                  removeElement(contextMenu.elementId!);
                  setContextMenu((p) => ({ ...p, show: false }));
                }}
              />
            </>
          ) : (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                Canvas
              </div>
              <ContextMenuItem
                icon={<ClipboardPaste className="w-3.5 h-3.5" />}
                label="Paste Here"
                shortcut="Ctrl+V"
                disabled={!clipboardElement}
                onClick={() => {
                  pasteElement(contextMenu.canvasX, contextMenu.canvasY);
                  setContextMenu((p) => ({ ...p, show: false }));
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ContextMenuItem({
  icon,
  label,
  shortcut,
  danger,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full text-left px-3 py-1.5 flex items-center gap-2.5 text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-popover-foreground hover:bg-accent",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {shortcut}
        </span>
      )}
    </button>
  );
}

function CanvasElement({
  element,
  onContextMenu,
}: {
  element: BuilderElement;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}) {
  const {
    selectedElementId,
    setSelectedElementId,
    updateElement,
    duplicateElement,
    removeElement,
    copyElement,
    pushHistory,
    zoom,
  } = useBuilder();
  const isSelected = selectedElementId === element.id;

  if (!element.visible) return null;

  const handleResizeStart = (
    e: React.PointerEvent,
    corner: "nw" | "ne" | "sw" | "se",
  ) => {
    e.stopPropagation();
    pushHistory();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startElX = element.x;
    const startElY = element.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;
      let newWidth = startWidth,
        newHeight = startHeight,
        newX = startElX,
        newY = startElY;
      if (corner === "se") {
        newWidth = startWidth + deltaX;
        newHeight = startHeight + deltaY;
      } else if (corner === "sw") {
        newWidth = startWidth - deltaX;
        newHeight = startHeight + deltaY;
        newX = startElX + deltaX;
      } else if (corner === "ne") {
        newWidth = startWidth + deltaX;
        newHeight = startHeight - deltaY;
        newY = startElY + deltaY;
      } else if (corner === "nw") {
        newWidth = startWidth - deltaX;
        newHeight = startHeight - deltaY;
        newX = startElX + deltaX;
        newY = startElY + deltaY;
      }
      if (newWidth < 20) {
        if (corner === "nw" || corner === "sw")
          newX = startElX + startWidth - 20;
        newWidth = 20;
      }
      if (newHeight < 20) {
        if (corner === "nw" || corner === "ne")
          newY = startElY + startHeight - 20;
        newHeight = 20;
      }
      updateElement(element.id, {
        width: Math.max(20, newWidth),
        height: Math.max(20, newHeight),
        x: newX,
        y: newY,
      });
    };
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Edge resize handles
  const handleEdgeResize = (
    e: React.PointerEvent,
    edge: "n" | "s" | "e" | "w",
  ) => {
    e.stopPropagation();
    pushHistory();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startElX = element.x;
    const startElY = element.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;
      let newWidth = startWidth,
        newHeight = startHeight,
        newX = startElX,
        newY = startElY;
      if (edge === "e") newWidth = Math.max(20, startWidth + deltaX);
      else if (edge === "w") {
        newWidth = Math.max(20, startWidth - deltaX);
        newX = startElX + Math.min(deltaX, startWidth - 20);
      } else if (edge === "s") newHeight = Math.max(20, startHeight + deltaY);
      else if (edge === "n") {
        newHeight = Math.max(20, startHeight - deltaY);
        newY = startElY + Math.min(deltaY, startHeight - 20);
      }
      updateElement(element.id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      });
    };
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleDragStart = (e: React.PointerEvent) => {
    if (element.locked) return;
    // Don't start drag if clicking on a resize handle or floating toolbar
    if ((e.target as HTMLElement).closest('.pointer-events-auto')) return;
    
    e.stopPropagation();
    setSelectedElementId(element.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startElX = element.x;
    const startElY = element.y;
    
    let hasDragged = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!hasDragged) {
        pushHistory();
        hasDragged = true;
      }
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;
      
      updateElement(element.id, {
        x: Math.round(startElX + deltaX),
        y: Math.round(startElY + deltaY),
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      onPointerDown={handleDragStart}
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        opacity: element.opacity,
        zIndex: element.zIndex,
        borderRadius: element.borderRadius,
        transform: `rotate(${element.rotation}deg)`,
        boxShadow: element.shadow
          ? "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
          : "none",
        cursor: element.locked ? "not-allowed" : "grab",
        borderWidth: element.borderWidth || 0,
        borderColor: element.borderColor || "transparent",
        borderStyle: element.borderStyle || "solid",
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElementId(element.id);
      }}
      onContextMenu={(e) => onContextMenu(e, element.id)}
      className={cn("group relative", isSelected && "outline-none")}
    >
      {/* Selection border with a gap */}
      {isSelected && (
        <div className="absolute -inset-1.5 border-2 border-primary rounded-[inherit] pointer-events-none z-40" />
      )}

      {/* Locked indicator */}
      {element.locked && isSelected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 z-50 pointer-events-none">
          <Lock className="w-3 h-3" /> Locked
        </div>
      )}

      {/* Floating Action Bar */}
      {isSelected && !element.locked && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover border border-border shadow-xl rounded-lg flex items-center gap-0.5 px-1 py-0.5 z-50 pointer-events-auto"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <button
            title="Copy"
            className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-primary transition-colors"
            onClick={() => copyElement(element.id)}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            title="Duplicate"
            className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-primary transition-colors"
            onClick={() => duplicateElement(element.id)}
          >
            <Files className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border" />
          <button
            title="Delete"
            className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => {
              pushHistory();
              removeElement(element.id);
            }}
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Corner Resize Handles */}
      {isSelected && !element.locked && (
        <>
          {(["nw", "ne", "sw", "se"] as const).map((corner) => (
            <div
              key={corner}
              className={cn(
                "absolute w-3 h-3 bg-background border-2 border-primary rounded-full z-50 pointer-events-auto shadow-sm transition-transform hover:scale-125",
                corner === "nw" && "-top-3 -left-3 cursor-nwse-resize",
                corner === "ne" && "-top-3 -right-3 cursor-nesw-resize",
                corner === "sw" && "-bottom-3 -left-3 cursor-nesw-resize",
                corner === "se" && "-bottom-3 -right-3 cursor-nwse-resize",
              )}
              onPointerDown={(e) => handleResizeStart(e, corner)}
            />
          ))}
          {/* Edge handles */}
          <div
            className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-2 h-6 bg-background border border-primary rounded-sm z-50 pointer-events-auto cursor-ew-resize hover:bg-primary/10 transition-colors"
            onPointerDown={(e) => handleEdgeResize(e, "w")}
          />
          <div
            className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-2 h-6 bg-background border border-primary rounded-sm z-50 pointer-events-auto cursor-ew-resize hover:bg-primary/10 transition-colors"
            onPointerDown={(e) => handleEdgeResize(e, "e")}
          />
          <div
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-background border border-primary rounded-sm z-50 pointer-events-auto cursor-ns-resize hover:bg-primary/10 transition-colors"
            onPointerDown={(e) => handleEdgeResize(e, "n")}
          />
          <div
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-background border border-primary rounded-sm z-50 pointer-events-auto cursor-ns-resize hover:bg-primary/10 transition-colors"
            onPointerDown={(e) => handleEdgeResize(e, "s")}
          />
        </>
      )}

      {/* Element Size Tooltip */}
      {isSelected && (
        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-mono pointer-events-none z-50 whitespace-nowrap">
          {Math.round(element.width)} × {Math.round(element.height)}
        </div>
      )}

      {/* Element Content */}
      <div
        className="w-full h-full relative overflow-hidden flex flex-col"
        style={{
          pointerEvents: "none",
          borderRadius: "inherit",
          padding: element.padding || 0,
        }}
      >
        {element.type === "text" && (
          <p
            style={{
              fontSize: element.fontSize,
              fontWeight: element.fontWeight,
              color: element.color,
              textAlign: element.textAlign,
              margin: 0,
              letterSpacing: element.letterSpacing,
              lineHeight: element.lineHeight,
              width: "100%",
              height: "100%",
            }}
          >
            {element.text}
          </p>
        )}
        {element.type === "heading" && (
          <h2
            style={{
              fontSize: element.fontSize,
              fontWeight: element.fontWeight,
              color: element.color,
              textAlign: element.textAlign,
              margin: 0,
              lineHeight: element.lineHeight || 1.2,
              letterSpacing: element.letterSpacing,
            }}
          >
            {element.text}
          </h2>
        )}
        {element.type === "button" && (
          <div
            style={{
              backgroundColor: element.backgroundColor,
              borderRadius: "inherit",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: element.fontSize,
                fontWeight: element.fontWeight,
                color: element.color,
              }}
            >
              {element.text}
            </span>
          </div>
        )}
        {element.type === "image" && (
          <img
            src={getImageUrl(element.imageUrl)}
            alt="Element"
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "inherit",
              pointerEvents: "none",
            }}
            onError={() => {
              console.error("Failed to load image:", getImageUrl(element.imageUrl));
              toast.error(`Failed to load image: ${element.imageUrl}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
