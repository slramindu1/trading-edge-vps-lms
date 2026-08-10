"use client";

import { useEffect, useState } from "react";
import { generateHTML } from "@tiptap/react";
import { type JSONContent } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import parse from "html-react-parser";

export function RenderDescription({ json }: { json: JSONContent }) {
  const [output, setOutput] = useState("");

  useEffect(() => {
    // This only runs on the client
    const html = generateHTML(json, [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ]);
    setOutput(html);
  }, [json]);

  return (
    <div className="prose dark:prose-invert prose-li:marker:text-primary">
      {parse(output)}
    </div>
  );
}
