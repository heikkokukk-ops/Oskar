"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errorMessage } from "@/lib/client";
import { AUDIENCE_LABELS, type Audience, type Persona } from "@/lib/types";

interface PersonaDialogProps {
  open: boolean;
  personas: Persona[];
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

type Draft = { id: string | null; name: string; audience: Audience; content: string };

const EMPTY_DRAFT: Draft = { id: null, name: "", audience: "all", content: "" };

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

export function PersonaDialog({ open, personas, onOpenChange, onChanged }: PersonaDialogProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function close(next: boolean) {
    if (!next) {
      setDraft(null);
      setPendingDelete(null);
    }
    onOpenChange(next);
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Sihtrühma nimi on kohustuslik.");
      return;
    }
    setSaving(true);
    try {
      const { id, ...data } = draft;
      await api("/api/prompts", { method: id ? "PUT" : "POST", json: id ? { id, ...data } : data });
      toast.success(id ? "Sihtrühm salvestatud." : "Sihtrühm lisatud.");
      setDraft(null);
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/prompts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      toast.success("Sihtrühm kustutatud.");
      setPendingDelete(null);
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogTitle>Halda sihtrühmi</DialogTitle>
        <DialogDescription>
          Sihtrühm aitab Oskaril eelistada vastuseid, mis on mõeldud just sellele kasutajale.
        </DialogDescription>

        {draft ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Nimi</span>
              <input
                className={inputClass}
                value={draft.name}
                maxLength={60}
                autoFocus
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Vastuste eelistus</span>
              <Select value={draft.audience} onValueChange={(v) => setDraft({ ...draft, audience: v as Audience })}>
                <SelectTrigger aria-label="Vastuste eelistus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      {AUDIENCE_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Kirjeldus</span>
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={draft.content}
                maxLength={1000}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={() => setDraft(null)}>
                Loobu
              </Button>
              <Button type="submit" disabled={saving}>
                Salvesta
              </Button>
            </div>
          </form>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
              {personas.length === 0 && <li className="p-4 text-sm text-zinc-400">Sihtrühmi pole veel lisatud.</li>}
              {personas.map((p) => (
                <li key={p.id} className="flex items-start gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">{p.name}</p>
                    <p className="text-xs text-violet-700">{AUDIENCE_LABELS[p.audience] ?? p.audience}</p>
                    {p.content && <p className="mt-1 text-sm text-zinc-500">{p.content}</p>}
                  </div>
                  {pendingDelete === p.id ? (
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="secondary" onClick={() => setPendingDelete(null)}>
                        Loobu
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => void remove(p.id)}>
                        Kustuta
                      </Button>
                    </div>
                  ) : (
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Muuda sihtrühma ${p.name}`}
                        onClick={() => setDraft({ id: p.id, name: p.name, audience: p.audience, content: p.content })}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-50 hover:text-red-600"
                        aria-label={`Kustuta sihtrühm ${p.name}`}
                        onClick={() => setPendingDelete(p.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" variant="secondary" onClick={() => setDraft(EMPTY_DRAFT)}>
              <Plus />
              Lisa sihtrühm
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
