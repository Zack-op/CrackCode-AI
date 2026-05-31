"use client";

import Editor from "@monaco-editor/react";

interface Props {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
}

export default function MonacoEditor({
  language,
  value,
  onChange,
}: Props) {
  return (
    <div className="rounded-2xl overflow-hidden border border-cyan-500/20">
      <Editor
        height="400px"
        language={language}
        value={value}
        theme="vs-dark"
        onChange={onChange}
      />
    </div>
  );
}