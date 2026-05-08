"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyDiscountCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-green-200 hover:border-green-300 transition-colors group"
    >
      <code className="text-green-700 font-mono font-bold text-lg">{code}</code>
      {copied ? (
        <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
          <Check className="w-4 h-4" /> Copied!
        </span>
      ) : (
        <span className="flex items-center gap-1 text-gray-400 group-hover:text-green-600 text-xs font-bold transition-colors">
          <Copy className="w-4 h-4" /> Copy
        </span>
      )}
    </button>
  );
}
