"use client";

interface Props {
  language: string;
  setLanguage: (lang: string) => void;
}

const languages = ["javascript", "python", "java", "cpp"];

export default function LanguageSelector({
  language,
  setLanguage,
}: Props) {
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="bg-black border border-cyan-500 rounded-xl px-4 py-2"
    >
      {languages.map((lang) => (
        <option key={lang} value={lang}>
          {lang.toUpperCase()}
        </option>
      ))}
    </select>
  );
}