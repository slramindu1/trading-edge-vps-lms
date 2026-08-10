"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BuilderProvider, useBuilder } from "@/components/builder/BuilderContext";
import { Toolbar } from "@/components/builder/Toolbar";
import { Canvas } from "@/components/builder/Canvas";
import { PropertiesPanel } from "@/components/builder/PropertiesPanel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "sonner";
import {
  Loader2, Save, Undo2, Redo2, ZoomIn, ZoomOut,
  ArrowLeft, Maximize, Monitor, Tablet, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";

function BuilderApp({ sectionKey }: { sectionKey: string }) {
  const {
    setElements, elements, canvasW, canvasH, setCanvasW, setCanvasH,
    undo, redo, canUndo, canRedo, pushHistory,
    zoom, zoomIn, zoomOut, zoomReset,
  } = useBuilder();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/builder?key=${sectionKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.elements) {
          try {
            const parsed = typeof data.elements === "string" ? JSON.parse(data.elements) : data.elements;
            // Migrate old elements that don't have name/locked fields
            const migrated = parsed.map((el: any, i: number) => ({
              ...el,
              name: el.name || `${(el.type || "element").charAt(0).toUpperCase() + (el.type || "element").slice(1)} ${i + 1}`,
              locked: el.locked ?? false,
              visible: el.visible ?? true,
              letterSpacing: el.letterSpacing ?? 0,
              lineHeight: el.lineHeight ?? (el.type === "heading" ? 1.2 : 1.5),
              borderWidth: el.borderWidth ?? 0,
              borderColor: el.borderColor ?? "transparent",
              borderStyle: el.borderStyle ?? "solid",
            }));
            setElements(migrated);
          } catch (e) {
            setElements([]);
          }
        }
        if (data.canvasW) setCanvasW(data.canvasW);
        if (data.canvasH) setCanvasH(data.canvasH);
      })
      .catch((err) => {
        toast.error("Failed to load section");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [sectionKey, setElements, setCanvasW, setCanvasH]);

  const handleSave = async () => {
    setSaving(true);
    pushHistory();
    try {
      const res = await fetch("/api/admin/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: sectionKey, elements, canvasW, canvasH }),
      });
      if (res.ok) {
        toast.success("Layout saved successfully!");
        setLastSaved(new Date().toLocaleTimeString());
      } else {
        toast.error("Failed to save layout");
      }
    } catch (err) {
      toast.error("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* ═══ TOP HEADER BAR ═══ */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2 bg-card shrink-0 z-50">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.close()}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Close Builder"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold capitalize leading-tight">{sectionKey.replace(/-/g, " ")}</h1>
            <p className="text-[10px] text-muted-foreground">
              {lastSaved ? `Last saved: ${lastSaved}` : "Unsaved changes"}
            </p>
          </div>
        </div>

        {/* Center: Tools */}
        <div className="flex items-center gap-1">
          {/* Undo/Redo */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 mr-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={zoomOut}
              className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom Out (Ctrl+-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={zoomReset}
              className="px-2 py-1.5 text-[11px] font-mono font-medium text-foreground hover:bg-background rounded-md min-w-[48px] text-center transition-colors"
              title="Reset Zoom (Ctrl+0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom In (Ctrl++)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Save */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground mr-1">{elements.length} elements</span>
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5 px-4 shadow-sm">
            {saving ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Publish"}
          </Button>
        </div>
      </header>

      {/* ═══ MAIN WORKSPACE ═══ */}
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <Canvas />
        <PropertiesPanel />
      </div>

      <Toaster position="bottom-center" richColors />
    </div>
  );
}

export default function BuilderPage() {
  const params = useParams();
  const key = Array.isArray(params.key) ? params.key[0] : params.key;

  if (!key) return <div>Invalid key</div>;

  return (
    <BuilderProvider>
      <BuilderApp sectionKey={key} />
    </BuilderProvider>
  );
}
