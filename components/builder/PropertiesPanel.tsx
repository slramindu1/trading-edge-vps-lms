"use client";
import React, { useRef, useState } from "react";
import { useBuilder } from "./BuilderContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlignLeft, AlignCenter, AlignRight, Bold, Eye, EyeOff,
  Lock, Unlock, Trash, Upload, RotateCcw, ChevronDown, ChevronUp,
  Minus, Plus, Layers, Palette, Settings2, Type
} from "lucide-react";

type Tab = "content" | "style" | "advanced";

export function PropertiesPanel() {
  const {
    elements, selectedElementId, updateElement, removeElement,
    canvasW, canvasH, setCanvasW, setCanvasH, pushHistory,
    toggleVisibility, toggleLock, moveLayerToTop, moveLayerToBottom,
  } = useBuilder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("content");

  const el = elements.find((e) => e.id === selectedElementId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !el) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        pushHistory();
        updateElement(el.id, { imageUrl: data.url });
      }
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  // No element selected → show canvas settings
  if (!el) {
    return (
      <div className="flex flex-col w-[300px] bg-card border-l border-border shrink-0 h-full">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" /> Canvas Settings
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Width (px)">
              <Input type="number" value={canvasW} onChange={(e) => setCanvasW(Number(e.target.value))} className="bg-background border-border h-8 text-xs" />
            </FieldGroup>
            <FieldGroup label="Height (px)">
              <Input type="number" value={canvasH} onChange={(e) => setCanvasH(Number(e.target.value))} className="bg-background border-border h-8 text-xs" />
            </FieldGroup>
          </div>
          <div className="rounded-lg bg-muted/30 border border-border p-4 text-center">
            <Layers className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-xs text-muted-foreground">Click an element on the canvas to edit its properties.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-[300px] bg-card border-l border-border shrink-0 h-full overflow-hidden">
      {/* Element Header */}
      <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
        <div className="flex-1 min-w-0">
          <Input
            value={el.name}
            onChange={(e) => updateElement(el.id, { name: e.target.value })}
            className="bg-transparent border-none p-0 h-6 text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <p className="text-[10px] text-muted-foreground capitalize">{el.type} Element</p>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => toggleVisibility(el.id)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title={el.visible ? "Hide" : "Show"}>
            {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => toggleLock(el.id)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title={el.locked ? "Unlock" : "Lock"}>
            {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { pushHistory(); removeElement(el.id); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete">
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {([
          { key: "content", label: "Content", icon: Type },
          { key: "style", label: "Style", icon: Palette },
          { key: "advanced", label: "Advanced", icon: Settings2 },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors",
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === "content" && (
          <>
            {/* Text Content */}
            {(el.type === "text" || el.type === "heading" || el.type === "button") && (
              <Section title="Text">
                <FieldGroup label="Content">
                  <textarea
                    value={el.text || ""}
                    onChange={(e) => updateElement(el.id, { text: e.target.value })}
                    rows={3}
                    className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </FieldGroup>
                <FieldGroup label="Alignment">
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateElement(el.id, { textAlign: align })}
                        className={cn(
                          "flex-1 py-1.5 rounded-md flex items-center justify-center transition-colors",
                          el.textAlign === align ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </FieldGroup>
              </Section>
            )}

            {/* Image Content */}
            {el.type === "image" && (
              <Section title="Image">
                <FieldGroup label="Source URL">
                  <Input value={el.imageUrl || ""} onChange={(e) => updateElement(el.id, { imageUrl: e.target.value })} className="bg-background border-border h-8 text-xs font-mono" />
                </FieldGroup>
                <Button variant="outline" className="w-full h-9 bg-background hover:bg-accent border-border gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5" /> Upload Image
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                {el.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                    <img src={getImageUrl(el.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </Section>
            )}
          </>
        )}

        {activeTab === "style" && (
          <>
            {/* Typography */}
            {(el.type === "text" || el.type === "heading" || el.type === "button") && (
              <Section title="Typography">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Font Size">
                    <NumberStepper value={el.fontSize || 16} onChange={(v) => updateElement(el.id, { fontSize: v })} min={8} max={200} suffix="px" />
                  </FieldGroup>
                  <FieldGroup label="Font Weight">
                    <select
                      value={el.fontWeight || 400}
                      onChange={(e) => updateElement(el.id, { fontWeight: Number(e.target.value) })}
                      className="w-full h-8 rounded-md bg-background border border-border px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value={100}>Thin</option>
                      <option value={300}>Light</option>
                      <option value={400}>Regular</option>
                      <option value={500}>Medium</option>
                      <option value={600}>Semi Bold</option>
                      <option value={700}>Bold</option>
                      <option value={800}>Extra Bold</option>
                      <option value={900}>Black</option>
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Letter Spacing">
                    <NumberStepper value={el.letterSpacing || 0} onChange={(v) => updateElement(el.id, { letterSpacing: v })} min={-5} max={20} step={0.5} suffix="px" />
                  </FieldGroup>
                  <FieldGroup label="Line Height">
                    <NumberStepper value={el.lineHeight || 1.5} onChange={(v) => updateElement(el.id, { lineHeight: v })} min={0.5} max={5} step={0.1} />
                  </FieldGroup>
                </div>
              </Section>
            )}

            {/* Colors */}
            <Section title="Colors">
              {(el.type === "text" || el.type === "heading" || el.type === "button") && (
                <FieldGroup label="Text Color">
                  <ColorPicker value={el.color || "#000000"} onChange={(c) => updateElement(el.id, { color: c })} />
                </FieldGroup>
              )}
              {el.type === "button" && (
                <FieldGroup label="Background">
                  <ColorPicker value={el.backgroundColor || "#6366f1"} onChange={(c) => updateElement(el.id, { backgroundColor: c })} />
                </FieldGroup>
              )}
            </Section>

            {/* Border & Spacing */}
            <Section title="Border & Spacing">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Radius">
                  <NumberStepper value={el.borderRadius} onChange={(v) => updateElement(el.id, { borderRadius: v })} min={0} max={500} suffix="px" />
                </FieldGroup>
                <FieldGroup label="Width">
                  <NumberStepper value={el.borderWidth || 0} onChange={(v) => updateElement(el.id, { borderWidth: v })} min={0} max={20} suffix="px" />
                </FieldGroup>
                <FieldGroup label="Padding (Gap)">
                  <NumberStepper value={el.padding || 0} onChange={(v) => updateElement(el.id, { padding: v })} min={0} max={100} suffix="px" />
                </FieldGroup>
              </div>
              {(el.borderWidth || 0) > 0 && (
                <FieldGroup label="Border Color">
                  <ColorPicker value={el.borderColor || "#000000"} onChange={(c) => updateElement(el.id, { borderColor: c })} />
                </FieldGroup>
              )}
            </Section>

            {/* Shadow & Opacity */}
            <Section title="Effects">
              <FieldGroup label="Opacity">
                <div className="flex items-center gap-2">
                  <input
                    type="range" min="0" max="1" step="0.05" value={el.opacity}
                    onChange={(e) => updateElement(el.id, { opacity: Number(e.target.value) })}
                    className="flex-1 h-1.5 accent-primary"
                  />
                  <span className="text-[11px] text-muted-foreground font-mono w-8 text-right">{Math.round(el.opacity * 100)}%</span>
                </div>
              </FieldGroup>
              <FieldGroup label="Box Shadow">
                <button
                  onClick={() => updateElement(el.id, { shadow: !el.shadow })}
                  className={cn(
                    "w-full h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors border",
                    el.shadow ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {el.shadow ? "Shadow ON" : "Shadow OFF"}
                </button>
              </FieldGroup>
            </Section>
          </>
        )}

        {activeTab === "advanced" && (
          <>
            <Section title="Position">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="X">
                  <NumberStepper value={Math.round(el.x)} onChange={(v) => updateElement(el.id, { x: v })} suffix="px" />
                </FieldGroup>
                <FieldGroup label="Y">
                  <NumberStepper value={Math.round(el.y)} onChange={(v) => updateElement(el.id, { y: v })} suffix="px" />
                </FieldGroup>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs bg-muted/30" onClick={() => { pushHistory(); updateElement(el.id, { x: Math.max(0, Math.round((canvasW - el.width) / 2)) }); }}>
                  Center X
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs bg-muted/30" onClick={() => { pushHistory(); updateElement(el.id, { y: Math.max(0, Math.round((canvasH - el.height) / 2)) }); }}>
                  Center Y
                </Button>
              </div>
            </Section>

            <Section title="Size">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Width">
                  <NumberStepper value={Math.round(el.width)} onChange={(v) => updateElement(el.id, { width: v })} min={20} suffix="px" />
                </FieldGroup>
                <FieldGroup label="Height">
                  <NumberStepper value={Math.round(el.height)} onChange={(v) => updateElement(el.id, { height: v })} min={20} suffix="px" />
                </FieldGroup>
              </div>
            </Section>

            <Section title="Transform">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Rotation">
                  <NumberStepper value={el.rotation} onChange={(v) => updateElement(el.id, { rotation: v })} min={-360} max={360} suffix="°" />
                </FieldGroup>
                <FieldGroup label="Z-Index">
                  <NumberStepper value={el.zIndex} onChange={(v) => updateElement(el.id, { zIndex: v })} min={0} max={999} />
                </FieldGroup>
              </div>
              <button
                onClick={() => updateElement(el.id, { rotation: 0 })}
                className="w-full h-8 rounded-md flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-muted transition-colors gap-1.5"
              >
                <RotateCcw className="w-3 h-3" /> Reset Rotation
              </button>
            </Section>

            <Section title="Layer Order">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => moveLayerToTop(el.id)}>
                  <ChevronUp className="w-3 h-3" /> Front
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => moveLayerToBottom(el.id)}>
                  <ChevronDown className="w-3 h-3" /> Back
                </Button>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Helper Components ─── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground block">{label}</Label>
      {children}
    </div>
  );
}

function NumberStepper({ value, onChange, min, max, step = 1, suffix }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center h-8 rounded-md border border-border bg-background overflow-hidden">
      <button className="px-1.5 h-full hover:bg-muted text-muted-foreground transition-colors shrink-0" onClick={() => onChange(Math.max(min ?? -Infinity, value - step))}>
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-full text-center text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-0"
      />
      {suffix && <span className="text-[10px] text-muted-foreground pr-0.5">{suffix}</span>}
      <button className="px-1.5 h-full hover:bg-muted text-muted-foreground transition-colors shrink-0" onClick={() => onChange(Math.min(max ?? Infinity, value + step))}>
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const presets = ["#000000", "#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <div className="w-8 h-8 rounded-md border border-border shadow-sm" style={{ backgroundColor: value }} />
        </div>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="bg-background border-border h-8 font-mono text-xs flex-1" />
      </div>
      <div className="flex gap-1.5">
        {presets.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cn("w-5 h-5 rounded-full border transition-transform hover:scale-125", value === c ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border")}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

function getImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return url;
  
  let finalUrl = url;
  if (!finalUrl.startsWith("/")) {
    finalUrl = `/assets/${finalUrl}`;
  }

  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || "https://tradingedgefx.com";
  return `${landingUrl.replace(/\/$/, '')}${finalUrl}`;
}
