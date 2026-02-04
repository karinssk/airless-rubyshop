"use client";

export type Language = "th" | "en";

export function LanguageTabs({
  activeLanguage,
  onLanguageChange,
}: {
  activeLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}) {
  return (
    <div className="flex gap-2 border-b border-gray-200 mb-6">
      <button
        onClick={() => onLanguageChange("th")}
        className={`px-6 py-3 font-medium transition-all relative ${
          activeLanguage === "th"
            ? "text-blue-600"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">🇹🇭</span>
          <span>ภาษาไทย</span>
        </span>
        {activeLanguage === "th" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
        )}
      </button>
      <button
        onClick={() => onLanguageChange("en")}
        className={`px-6 py-3 font-medium transition-all relative ${
          activeLanguage === "en"
            ? "text-blue-600"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">🇬🇧</span>
          <span>English</span>
        </span>
        {activeLanguage === "en" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
        )}
      </button>
    </div>
  );
}
