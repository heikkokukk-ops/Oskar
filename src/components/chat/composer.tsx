"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_MESSAGE_LENGTH } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ComposerProps {
  disabled: boolean;
  canClear: boolean;
  // Resolves to false when sending failed, so the draft can be restored.
  onSend: (text: string, attachmentName: string | null) => Promise<boolean>;
  onClear: () => void;
}

const MAX_HEIGHT = 200;

export function Composer({ disabled, canClear, onSend, onClear }: ComposerProps) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tooLong = text.length > MAX_MESSAGE_LENGTH;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  async function submit() {
    if (disabled) return;
    if (!text.trim()) {
      setError("Sõnum ei saa olla tühi.");
      return;
    }
    if (tooLong) return;

    const draft = { text, attachment };
    setText("");
    setAttachment(null);
    setError(null);
    const ok = await onSend(draft.text.trim(), draft.attachment);
    if (!ok) {
      setText(draft.text);
      setAttachment(draft.attachment);
    }
    textareaRef.current?.focus();
  }

  return (
    <div className="border-t border-zinc-200 bg-white px-4 pb-3 pt-3">
      <div className="mx-auto max-w-3xl">
        {attachment && (
          <div className="mb-2 inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1 text-sm text-zinc-700">
            <Paperclip className="size-3.5 shrink-0 text-zinc-400" />
            <span className="truncate">{attachment}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="flex size-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
              aria-label="Eemalda fail"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <div
          className={cn(
            "rounded-xl border bg-white shadow-sm focus-within:ring-2",
            tooLong || error ? "border-red-300 focus-within:ring-red-200" : "border-zinc-200 focus-within:ring-violet-200",
          )}
        >
          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            placeholder="Kirjuta oma küsimus..."
            aria-label="Sinu küsimus"
            aria-invalid={tooLong || !!error}
            className="block max-h-[200px] w-full resize-none bg-transparent px-4 pt-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <div className="flex items-center gap-1 px-2 pb-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAttachment(file.name);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileRef.current?.click()}
              aria-label="Lisa fail"
              title="Lisa fail"
            >
              <Paperclip />
            </Button>
            <span className={cn("ml-auto text-xs", tooLong ? "text-red-600" : "text-zinc-400")}>
              {text.length > MAX_MESSAGE_LENGTH * 0.8 && `${text.length}/${MAX_MESSAGE_LENGTH}`}
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={onClear}
              disabled={!canClear}
              aria-label="Tühjenda vestlus"
              title="Tühjenda vestlus"
            >
              <Eraser />
              <span className="hidden sm:inline">Tühjenda vestlus</span>
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={disabled || tooLong}>
              <Send />
              Saada
            </Button>
          </div>
        </div>

        <p className="mt-1.5 min-h-4 text-xs" aria-live="polite">
          {tooLong ? (
            <span className="text-red-600">
              Sõnum on liiga pikk. Lubatud on kuni {MAX_MESSAGE_LENGTH} tähemärki (praegu {text.length}).
            </span>
          ) : error ? (
            <span className="text-red-600">{error}</span>
          ) : (
            <span className="hidden text-zinc-400 sm:inline">Enter saadab, Shift+Enter lisab uue rea.</span>
          )}
        </p>
      </div>
    </div>
  );
}
