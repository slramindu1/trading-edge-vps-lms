"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

export type ElementType = "text" | "image" | "heading" | "button";

export interface BuilderElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  borderRadius: number;
  shadow: boolean;
  visible: boolean;
  locked: boolean;
  name: string;

  // Text/Heading/Button specific
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;

  // Image specific
  imageUrl?: string;

  // Button/Box specific
  backgroundColor?: string;
  padding?: number;

  // Border
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
}

interface BuilderContextType {
  elements: BuilderElement[];
  setElements: React.Dispatch<React.SetStateAction<BuilderElement[]>>;
  selectedElementId: string | null;
  setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>;
  canvasW: number;
  canvasH: number;
  setCanvasW: React.Dispatch<React.SetStateAction<number>>;
  setCanvasH: React.Dispatch<React.SetStateAction<number>>;
  updateElement: (id: string, updates: Partial<BuilderElement>) => void;
  removeElement: (id: string) => void;

  // Clipboard
  clipboardElement: BuilderElement | null;
  copyElement: (id: string) => void;
  pasteElement: (x?: number, y?: number) => void;
  duplicateElement: (id: string) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: () => void;

  // Zoom
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;

  // Layers
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  moveLayerToTop: (id: string) => void;
  moveLayerToBottom: (id: string) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;

  // Left panel
  leftPanel: "elements" | "layers";
  setLeftPanel: React.Dispatch<React.SetStateAction<"elements" | "layers">>;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

const MAX_HISTORY = 50;

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [elements, setElements] = useState<BuilderElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [canvasW, setCanvasW] = useState(1200);
  const [canvasH, setCanvasH] = useState(800);
  const [clipboardElement, setClipboardElement] = useState<BuilderElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [leftPanel, setLeftPanel] = useState<"elements" | "layers">("elements");

  // Undo/Redo
  const [history, setHistory] = useState<BuilderElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);

  const pushHistory = useCallback(() => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(elements)));
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [elements, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    isUndoRedo.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setElements(JSON.parse(JSON.stringify(history[newIndex])));
    setTimeout(() => { isUndoRedo.current = false; }, 0);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    isUndoRedo.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setElements(JSON.parse(JSON.stringify(history[newIndex])));
    setTimeout(() => { isUndoRedo.current = false; }, 0);
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Auto-push history on first load
  useEffect(() => {
    if (history.length === 0 && elements.length > 0) {
      setHistory([JSON.parse(JSON.stringify(elements))]);
      setHistoryIndex(0);
    }
  }, [elements, history.length]);

  const updateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  const removeElement = useCallback((id: string) => {
    pushHistory();
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  }, [selectedElementId, pushHistory]);

  const copyElement = useCallback((id: string) => {
    const el = elements.find((e) => e.id === id);
    if (el) setClipboardElement(el);
  }, [elements]);

  const pasteElement = useCallback((x?: number, y?: number) => {
    if (!clipboardElement) return;
    pushHistory();
    const newEl: BuilderElement = {
      ...clipboardElement,
      id: `el_${Date.now()}`,
      name: `${clipboardElement.name} (copy)`,
      x: x !== undefined ? x : clipboardElement.x + 20,
      y: y !== undefined ? y : clipboardElement.y + 20,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  }, [clipboardElement, pushHistory]);

  const duplicateElement = useCallback((id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    pushHistory();
    const newEl: BuilderElement = {
      ...el,
      id: `el_${Date.now()}`,
      name: `${el.name} (copy)`,
      x: el.x + 20,
      y: el.y + 20,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  }, [elements, pushHistory]);

  // Zoom
  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.1, 3)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.1, 0.2)), []);
  const zoomReset = useCallback(() => setZoom(1), []);

  // Layer operations
  const moveLayerUp = useCallback((id: string) => {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const moveLayerDown = useCallback((id: string) => {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      return next;
    });
  }, []);

  const moveLayerToTop = useCallback((id: string) => {
    setElements((prev) => {
      const el = prev.find((e) => e.id === id);
      if (!el) return prev;
      return [...prev.filter((e) => e.id !== id), el];
    });
  }, []);

  const moveLayerToBottom = useCallback((id: string) => {
    setElements((prev) => {
      const el = prev.find((e) => e.id === id);
      if (!el) return prev;
      return [el, ...prev.filter((e) => e.id !== id)];
    });
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el))
    );
  }, []);

  const toggleLock = useCallback((id: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el))
    );
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementId) {
          removeElement(selectedElementId);
        }
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c" && selectedElementId) {
          e.preventDefault();
          copyElement(selectedElementId);
        }
        if (e.key === "v") {
          e.preventDefault();
          pasteElement();
        }
        if (e.key === "d" && selectedElementId) {
          e.preventDefault();
          duplicateElement(selectedElementId);
        }
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        }
        if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          redo();
        }
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          zoomIn();
        }
        if (e.key === "-") {
          e.preventDefault();
          zoomOut();
        }
        if (e.key === "0") {
          e.preventDefault();
          zoomReset();
        }
      }
      if (e.key === "Escape") {
        setSelectedElementId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, copyElement, pasteElement, duplicateElement, removeElement, undo, redo, zoomIn, zoomOut, zoomReset]);

  return (
    <BuilderContext.Provider
      value={{
        elements, setElements,
        selectedElementId, setSelectedElementId,
        canvasW, canvasH, setCanvasW, setCanvasH,
        updateElement, removeElement,
        clipboardElement, copyElement, pasteElement, duplicateElement,
        undo, redo, canUndo, canRedo, pushHistory,
        zoom, setZoom, zoomIn, zoomOut, zoomReset,
        moveLayerUp, moveLayerDown, moveLayerToTop, moveLayerToBottom,
        toggleVisibility, toggleLock,
        leftPanel, setLeftPanel,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) throw new Error("useBuilder must be used within BuilderProvider");
  return context;
}
