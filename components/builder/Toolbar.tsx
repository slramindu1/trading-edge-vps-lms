"use client";
import React, { useState } from "react";
import { useBuilder, BuilderElement } from "./BuilderContext";
import { 
  Type, Image as ImageIcon, Heading1, MousePointerClick, Search,
  Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Layers, LayoutGrid, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Toolbar() {
  const { setElements, setSelectedElementId, pushHistory, elements, leftPanel, setLeftPanel,
    selectedElementId, toggleVisibility, toggleLock, moveLayerUp, moveLayerDown, canvasW, canvasH, setCanvasW, setCanvasH } = useBuilder();
  const [searchQuery, setSearchQuery] = useState("");

  const loadDefaultLayout = () => {
    pushHistory();
    setCanvasW(1200);
    
    const layout: BuilderElement[] = [];

    const images = [
      "/assets/5.jpg", "/assets/new3.jpg", "/assets/new7.jpg", "/assets/4.jpg", "/assets/new10.jpg", "/assets/new13.jpg", 
      "/assets/new1.jpg", "/assets/new4.jpg", "/assets/new5.jpg", "/assets/new8.jpg", "/assets/new11.jpg", "/assets/11.jpg", 
      "/assets/new2.jpg", "/assets/new6.jpg", "/assets/new9.jpg", "/assets/new12.jpg", "/assets/new14.jpg"
    ];

    let col = 0;
    const colWidth = 340;
    const gap = 20;
    const startX = 60;
    let yOffsets = [20, 20, 20];

    images.forEach((src, i) => {
      const currentY = yOffsets[col];
      const width = colWidth;
      const height = 450; 
      
      layout.push({
        id: `img_${i}`, type: "image", name: `Image ${i+1}`, imageUrl: src,
        x: startX + col * (colWidth + gap), y: currentY, width, height,
        rotation: 0, opacity: 1, zIndex: 1, borderRadius: 16, shadow: true, visible: true, locked: false
      });
      
      yOffsets[col] += height + gap;
      col = (col + 1) % 3;
    });

    const maxH = Math.max(...yOffsets) + 100;
    setCanvasH(maxH);
    setElements(layout);
  };

  const addElement = (type: BuilderElement["type"]) => {
    pushHistory();
    const count = elements.filter((e) => e.type === type).length + 1;
    const elWidth = type === "image" ? 300 : type === "heading" ? 250 : 150;
    const elHeight = type === "image" ? 200 : 50;
    const offset = (elements.length % 10) * 20; // Cascade effect to prevent piling up
    const newEl: BuilderElement = {
      id: `el_${Date.now()}`,
      type,
      x: Math.max(0, Math.round((canvasW - elWidth) / 2)) + offset,
      y: Math.max(0, Math.round((canvasH - elHeight) / 2)) + offset,
      width: elWidth,
      height: elHeight,
      rotation: 0,
      opacity: 1,
      zIndex: elements.length + 1,
      borderRadius: type === "button" ? 8 : 0,
      shadow: false,
      visible: true,
      locked: false,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`,
      ...(type === "text" && {
        text: "Add your text here",
        fontSize: 16,
        fontWeight: 400,
        color: "#333333",
        textAlign: "left" as const,
        letterSpacing: 0,
        lineHeight: 1.5,
      }),
      ...(type === "heading" && {
        text: "Heading",
        fontSize: 32,
        fontWeight: 700,
        color: "#111111",
        textAlign: "left" as const,
        letterSpacing: -0.5,
        lineHeight: 1.2,
      }),
      ...(type === "button" && {
        text: "Click Me",
        fontSize: 14,
        fontWeight: 600,
        color: "#ffffff",
        backgroundColor: "#6366f1",
        textAlign: "center" as const,
        borderRadius: 8,
      }),
      ...(type === "image" && {
        imageUrl: "https://placehold.co/300x200",
      }),
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  const elementsList = [
    { type: "heading", label: "Heading", icon: Heading1, desc: "Title text" },
    { type: "text", label: "Text", icon: Type, desc: "Paragraph text" },
    { type: "image", label: "Image", icon: ImageIcon, desc: "Photo or graphic" },
    { type: "button", label: "Button", icon: MousePointerClick, desc: "CTA button" },
  ];

  const filteredElements = elementsList.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text": return <Type className="w-3.5 h-3.5" />;
      case "heading": return <Heading1 className="w-3.5 h-3.5" />;
      case "image": return <ImageIcon className="w-3.5 h-3.5" />;
      case "button": return <MousePointerClick className="w-3.5 h-3.5" />;
      default: return <Type className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col w-[280px] bg-card border-r border-border shrink-0 h-full">
      {/* Panel Tabs */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setLeftPanel("elements")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
            leftPanel === "elements"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <LayoutGrid className="w-4 h-4" /> Widgets
        </button>
        <button
          onClick={() => setLeftPanel("layers")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
            leftPanel === "layers"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Layers className="w-4 h-4" /> Layers
        </button>
      </div>

      {leftPanel === "elements" ? (
        <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search widgets..."
              className="pl-9 bg-background border-border text-sm h-9"
            />
          </div>

          {/* Elements Grid */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Basic</p>
            <div className="grid grid-cols-2 gap-2">
              {filteredElements.map((item) => (
                <div
                  key={item.type}
                  onClick={() => addElement(item.type as BuilderElement["type"])}
                  className="flex flex-col items-center justify-center gap-1.5 p-3.5 border border-border bg-background rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <item.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="mt-auto pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full mb-4 text-[11px]"
              onClick={() => {
                if (confirm("This will replace your current layout. Are you sure?")) {
                  loadDefaultLayout();
                }
              }}
            >
              Load Default Design
            </Button>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Shortcuts</p>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex justify-between"><span>Copy</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl+C</kbd></div>
              <div className="flex justify-between"><span>Paste</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl+V</kbd></div>
              <div className="flex justify-between"><span>Duplicate</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl+D</kbd></div>
              <div className="flex justify-between"><span>Undo</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl+Z</kbd></div>
              <div className="flex justify-between"><span>Delete</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Del</kbd></div>
              <div className="flex justify-between"><span>Zoom</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl +/-</kbd></div>
            </div>
          </div>
        </div>
      ) : (
        /* Layers Panel */
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-3 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {elements.length} Layer{elements.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {[...elements].reverse().map((el) => (
              <div
                key={el.id}
                onClick={() => setSelectedElementId(el.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-border/50 transition-colors group",
                  selectedElementId === el.id
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                <div className={cn("shrink-0 text-muted-foreground", selectedElementId === el.id && "text-primary")}>
                  {getTypeIcon(el.type)}
                </div>
                <span className={cn(
                  "flex-1 text-xs truncate",
                  selectedElementId === el.id ? "text-primary font-medium" : "text-foreground",
                  !el.visible && "line-through opacity-50"
                )}>
                  {el.name}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(el.id); }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                    title={el.visible ? "Hide" : "Show"}
                  >
                    {el.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                    title={el.locked ? "Unlock" : "Lock"}
                  >
                    {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveLayerUp(el.id); }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground" title="Move Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveLayerDown(el.id); }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground" title="Move Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {elements.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Layers className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">No layers yet</p>
                <p className="text-[10px] opacity-60">Add widgets from the Elements tab</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
