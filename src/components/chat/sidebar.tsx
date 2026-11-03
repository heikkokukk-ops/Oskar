"use client";

import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/client";
import type { ChatSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  chats: ChatSummary[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function Sidebar({ chats, activeId, open, onClose, onSelect, onDelete, onNew }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn("fixed inset-0 z-30 bg-zinc-950/30 md:hidden", open ? "block" : "hidden")}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-zinc-200 bg-white transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0 shadow-xl" : "-translate-x-full",
        )}
        aria-label="Vestluste ajalugu"
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-4">
          <h2 className="text-sm font-semibold text-zinc-700">Vestluste ajalugu</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose} aria-label="Sulge menüü">
            <X />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {chats.length === 0 ? (
            <p className="px-2 py-4 text-sm text-zinc-400">Vestlusi veel pole.</p>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => (
                <li key={chat.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(chat.id)}
                    className={cn(
                      "flex min-h-12 w-full items-start gap-2 rounded-lg px-3 py-2 pr-11 text-left transition-colors",
                      chat.id === activeId ? "bg-violet-50 text-violet-900" : "text-zinc-700 hover:bg-zinc-100",
                    )}
                    aria-current={chat.id === activeId ? "page" : undefined}
                  >
                    <MessageSquare
                      className={cn("mt-0.5 size-4 shrink-0", chat.id === activeId ? "text-violet-600" : "text-zinc-400")}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{chat.title}</span>
                      <span className="block text-xs text-zinc-400">{formatDateTime(chat.updatedAt)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(chat.id)}
                    className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    aria-label={`Kustuta vestlus "${chat.title}"`}
                    title="Kustuta vestlus"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="sticky bottom-0 border-t border-zinc-100 bg-white p-3">
          <Button className="w-full" onClick={onNew}>
            <Plus />
            Uus vestlus
          </Button>
        </div>
      </aside>
    </>
  );
}
