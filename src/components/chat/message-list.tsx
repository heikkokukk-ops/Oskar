"use client";

import { useEffect, useRef } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { formatTime } from "@/lib/client";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface Example {
  id: number;
  topic: string;
  question: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  examples: Example[];
  typing: boolean;
  onAsk: (question: string) => void;
  onRate: (message: ChatMessage, value: 1 | -1) => void;
}

export function MessageList({ messages, examples, typing, onAsk, onRate }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {messages.length === 0 && !typing ? (
          <Welcome examples={examples} onAsk={onAsk} />
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id} message={m} />
            ) : (
              <AssistantBubble key={m.id} message={m} onAsk={onAsk} onRate={onRate} />
            ),
          )
        )}
        {typing && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
      O
    </div>
  );
}

function Welcome({ examples, onAsk }: { examples: Example[]; onAsk: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center py-6 text-center sm:py-12">
      <div className="flex size-14 items-center justify-center rounded-full bg-violet-600 text-xl font-semibold text-white shadow-md">
        O
      </div>
      <h2 className="mt-4 text-xl font-semibold text-zinc-900">Tere! Mina olen Oskar.</h2>
      <p className="mt-2 max-w-md text-zinc-600">
        Olen OIXIO Digitali koolitusabiline ja vastan küsimustele meie AI, Microsoft 365 Copiloti ja Power BI koolituste
        kohta. Vali allpool näidisküsimus või kirjuta oma küsimus.
      </p>
      {examples.length > 0 && (
        <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
          {examples.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onAsk(e.question)}
              className="min-h-11 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50"
            >
              <span className="block text-xs font-medium text-violet-600">{e.topic}</span>
              <span className="mt-0.5 block text-sm text-zinc-800">{e.question}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col items-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-violet-600 px-4 py-2.5 text-white shadow-sm sm:max-w-[75%]">
        {message.content}
      </div>
      <time className="mt-1 text-[11px] text-zinc-400" dateTime={message.createdAt}>
        {formatTime(message.createdAt)}
      </time>
    </div>
  );
}

interface AssistantBubbleProps {
  message: ChatMessage;
  onAsk: (question: string) => void;
  onRate: (message: ChatMessage, value: 1 | -1) => void;
}

function AssistantBubble({ message, onAsk, onRate }: AssistantBubbleProps) {
  const suggestions = message.suggestions ?? [];
  const isFallback = message.knowledgeEntryId == null;

  return (
    <div className="flex gap-2">
      <Avatar />
      <div className="flex min-w-0 max-w-[85%] flex-col items-start sm:max-w-[75%]">
        <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-md bg-zinc-100 px-4 py-2.5 text-zinc-800">
          {message.content}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 text-xs text-zinc-500">{isFallback ? "Proovi näiteks:" : "Seotud küsimused:"}</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onAsk(q)}
                  className="min-h-9 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-left text-sm text-violet-700 transition-colors hover:bg-violet-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
          {message.sourceTopic && (
            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700">
              Allikas: {message.sourceTopic}
            </span>
          )}
          <span className="flex items-center">
            <RateButton active={message.rating === 1} label="Hea vastus" onClick={() => onRate(message, 1)}>
              <ThumbsUp className="size-4" />
            </RateButton>
            <RateButton active={message.rating === -1} label="Halb vastus" onClick={() => onRate(message, -1)}>
              <ThumbsDown className="size-4" />
            </RateButton>
          </span>
        </div>
      </div>
    </div>
  );
}

interface RateButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

function RateButton({ active, label, onClick, children }: RateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-md transition-colors",
        active ? "bg-violet-100 text-violet-700" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700",
      )}
    >
      {children}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <Avatar />
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-zinc-100 px-4 py-2.5 text-sm text-zinc-500">
        Oskar kirjutab
        <span className="flex gap-0.5">
          <span className="typing-dot size-1.5 rounded-full bg-zinc-400" />
          <span className="typing-dot size-1.5 rounded-full bg-zinc-400 [animation-delay:150ms]" />
          <span className="typing-dot size-1.5 rounded-full bg-zinc-400 [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}
