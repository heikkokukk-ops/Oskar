"use client";

import { Menu, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnswerStyle, Persona } from "@/lib/types";

const NO_PERSONA = "none";

interface ChatHeaderProps {
  answerStyle: AnswerStyle;
  personaId: string | null;
  personas: Persona[];
  disabled: boolean;
  onMenu: () => void;
  onStyleChange: (style: AnswerStyle) => void;
  onPersonaChange: (personaId: string | null) => void;
  onManagePersonas: () => void;
}

export function ChatHeader({
  answerStyle,
  personaId,
  personas,
  disabled,
  onMenu,
  onStyleChange,
  onPersonaChange,
  onManagePersonas,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button variant="ghost" size="icon" className="-ml-2 md:hidden" onClick={onMenu} aria-label="Ava menüü">
            <Menu />
          </Button>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
            O
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-zinc-900">Oskar</h1>
            <p className="truncate text-xs text-zinc-500">OIXIO Digital koolitusabiline</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          <label className="flex min-w-[140px] flex-1 flex-col gap-1 sm:flex-none">
            <span className="text-xs font-medium text-zinc-500">Vastuse stiil</span>
            <Select value={answerStyle} onValueChange={(v) => onStyleChange(v as AnswerStyle)} disabled={disabled}>
              <SelectTrigger className="sm:w-36" aria-label="Vastuse stiil">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Lühike</SelectItem>
                <SelectItem value="detailed">Põhjalik</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="flex min-w-[160px] flex-1 flex-col gap-1 sm:flex-none">
            <span className="text-xs font-medium text-zinc-500">Sihtrühm</span>
            <Select
              value={personaId ?? NO_PERSONA}
              onValueChange={(v) => onPersonaChange(v === NO_PERSONA ? null : v)}
              disabled={disabled}
            >
              <SelectTrigger className="sm:w-48" aria-label="Sihtrühm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PERSONA}>Määramata</SelectItem>
                {personas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <Button variant="secondary" onClick={onManagePersonas} title="Halda sihtrühmi">
            <Users />
            <span className="hidden lg:inline">Halda sihtrühmi</span>
            <span className="sr-only lg:hidden">Halda sihtrühmi</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
