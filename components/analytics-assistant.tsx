'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Clock, FileText, Sparkles, X } from 'lucide-react';
import Image from 'next/image';

export function AnalyticsAssistant() {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    adjustHeight();
    textarea.addEventListener('input', adjustHeight);

    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [inputValue]);

  return (
    <aside className="hidden w-80 flex-col border-l border-gray-200 bg-white lg:flex">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/download%201-bUusUOl6lv3POJAEYqqqAXilMV3nwp.png"
              alt="ACI Analytics"
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </div>
          <h3 className="font-bold text-amber-500">ACI Analytics</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <Clock className="h-5 w-5" />
          </button>
          <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            ?
          </div>
          <p className="text-sm text-gray-700">
            Ask questions to clarify material and stay on track
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <p className="text-sm text-gray-700">Get a better understanding and analyze</p>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <p className="text-sm text-gray-700">Forecast the future and improve performance</p>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <p className="text-sm text-gray-700">Build meaningful reports for your audiences</p>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="relative rounded-lg border border-gray-200 bg-white">
          <textarea
            ref={textareaRef}
            placeholder="Ask a question or prompt"
            className="max-h-[120px] min-h-[40px] w-full resize-none bg-white px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none"
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          ></textarea>

          <div className="absolute right-2 bottom-2 flex items-center">
            <button className="rounded-md bg-gray-200 p-1.5 text-gray-600 hover:bg-gray-300">
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
