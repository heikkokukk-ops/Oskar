"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/client";
import {
  MAX_MESSAGE_LENGTH,
  type AnswerStyle,
  type ChatDetail,
  type ChatMessage,
  type ChatSettings,
  type ChatSummary,
  type Persona,
} from "@/lib/types";
import { AdvancedSettings } from "./advanced-settings";
import { ChatHeader } from "./chat-header";
import { Composer } from "./composer";
import { ConfirmDialog } from "./confirm-dialog";
import { MessageList, type Example } from "./message-list";
import { PersonaDialog } from "./persona-dialog";
import { Sidebar } from "./sidebar";

interface SendResponse {
  chat: ChatSummary;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

type Confirm = { kind: "delete"; id: string } | { kind: "clear" } | null;

function toSummary(chat: ChatDetail): ChatSummary {
  return { id: chat.id, title: chat.title, updatedAt: chat.updatedAt };
}

export function OskarApp() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [active, setActive] = useState<ChatDetail | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const openChat = useCallback(async (id: string) => {
    setActive(await api<ChatDetail>(`/api/chats/${id}`));
    setSidebarOpen(false);
  }, []);

  const createChat = useCallback(async (settings?: Partial<ChatSettings>) => {
    const chat = await api<ChatDetail>("/api/chats", { method: "POST", json: settings ?? {} });
    setChats((list) => [toSummary(chat), ...list]);
    setActive(chat);
    setSidebarOpen(false);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [chatList, personaList, exampleList] = await Promise.all([
        api<ChatSummary[]>("/api/chats"),
        api<Persona[]>("/api/prompts"),
        api<Example[]>("/api/knowledge/examples"),
      ]);
      setChats(chatList);
      setPersonas(personaList);
      setExamples(exampleList);
      if (chatList.length > 0) await openChat(chatList[0].id);
      else await createChat();
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [openChat, createChat]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleNewChat() {
    // An empty chat is already a new chat; avoid piling up empty sessions.
    if (active && active.messages.length === 0) {
      setSidebarOpen(false);
      toast("Uus vestlus on juba avatud.");
      return;
    }
    try {
      await createChat(
        active
          ? { answerStyle: active.answerStyle, personaId: active.personaId, temperature: active.temperature, topP: active.topP }
          : undefined,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleSelect(id: string) {
    if (id === active?.id) {
      setSidebarOpen(false);
      return;
    }
    try {
      await openChat(id);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleDelete(id: string) {
    try {
      await api(`/api/chats/${id}`, { method: "DELETE" });
      const remaining = chats.filter((c) => c.id !== id);
      setChats(remaining);
      toast.success("Vestlus kustutatud.");
      if (active?.id === id) {
        if (remaining.length > 0) await openChat(remaining[0].id);
        else await createChat();
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleClear() {
    if (!active) return;
    try {
      const chat = await api<ChatDetail>(`/api/chats/${active.id}`, { method: "PATCH", json: { clear: true } });
      setActive(chat);
      setChats((list) => list.map((c) => (c.id === chat.id ? toSummary(chat) : c)));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function updateSettings(patch: Partial<ChatSettings>) {
    if (!active) return;
    const previous = active;
    setActive({ ...active, ...patch });
    try {
      const chat = await api<ChatDetail>(`/api/chats/${active.id}`, { method: "PATCH", json: patch });
      setActive((current) => (current?.id === chat.id ? chat : current));
    } catch (error) {
      setActive(previous);
      toast.error(errorMessage(error));
    }
  }

  async function handleSend(text: string, attachmentName: string | null): Promise<boolean> {
    if (!active || typing) return false;
    if (!text.trim()) {
      toast.error("Sõnum ei saa olla tühi.");
      return false;
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Sõnum on liiga pikk. Lubatud on kuni ${MAX_MESSAGE_LENGTH} tähemärki.`);
      return false;
    }

    const chatId = active.id;
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      role: "user",
      content: attachmentName ? `${text}\n(manus: ${attachmentName})` : text,
      sourceTopic: null,
      knowledgeEntryId: null,
      rating: null,
      createdAt: new Date().toISOString(),
    };
    setActive((current) => (current ? { ...current, messages: [...current.messages, optimistic] } : current));
    setTyping(true);

    try {
      const result = await api<SendResponse>(`/api/chats/${chatId}/messages`, {
        method: "POST",
        json: { content: text, attachmentName },
      });
      setActive((current) =>
        current?.id === chatId
          ? {
              ...current,
              title: result.chat.title,
              updatedAt: result.chat.updatedAt,
              messages: [
                ...current.messages.filter((m) => m.id !== tempId),
                result.userMessage,
                result.assistantMessage,
              ],
            }
          : current,
      );
      setChats((list) => [result.chat, ...list.filter((c) => c.id !== chatId)]);
      return true;
    } catch (error) {
      setActive((current) =>
        current ? { ...current, messages: current.messages.filter((m) => m.id !== tempId) } : current,
      );
      toast.error(errorMessage(error));
      return false;
    } finally {
      setTyping(false);
    }
  }

  async function handleRate(message: ChatMessage, value: 1 | -1) {
    const rating = message.rating === value ? null : value;
    const setRating = (r: number | null) =>
      setActive((current) =>
        current
          ? { ...current, messages: current.messages.map((m) => (m.id === message.id ? { ...m, rating: r } : m)) }
          : current,
      );
    setRating(rating);
    try {
      await api(`/api/messages/${message.id}/rating`, { method: "PATCH", json: { rating } });
    } catch (error) {
      setRating(message.rating);
      toast.error(errorMessage(error));
    }
  }

  async function handlePersonasChanged() {
    try {
      setPersonas(await api<Persona[]>("/api/prompts"));
      // A deleted persona is unset on the chat by the database; reload to reflect that.
      if (active) setActive(await api<ChatDetail>(`/api/chats/${active.id}`));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const disabled = !active || loading;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        chats={chats}
        activeId={active?.id ?? null}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(id) => void handleSelect(id)}
        onDelete={(id) => setConfirm({ kind: "delete", id })}
        onNew={() => void handleNewChat()}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          answerStyle={active?.answerStyle ?? "short"}
          personaId={active?.personaId ?? null}
          personas={personas}
          disabled={disabled}
          onMenu={() => setSidebarOpen(true)}
          onStyleChange={(answerStyle: AnswerStyle) => void updateSettings({ answerStyle })}
          onPersonaChange={(personaId) => void updateSettings({ personaId })}
          onManagePersonas={() => setPersonaDialogOpen(true)}
        />
        <AdvancedSettings
          temperature={active?.temperature ?? 0.5}
          topP={active?.topP ?? 0.9}
          disabled={disabled}
          onCommit={(values) => void updateSettings(values)}
        />

        {loadError ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-sm rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
              <AlertTriangle className="mx-auto size-8 text-red-500" />
              <p className="mt-3 text-zinc-700">{loadError}</p>
              <Button className="mt-4" variant="secondary" onClick={() => void loadAll()}>
                <RefreshCw />
                Proovi uuesti
              </Button>
            </div>
          </div>
        ) : loading && !active ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">Laadin…</div>
        ) : (
          <MessageList
            messages={active?.messages ?? []}
            examples={examples}
            typing={typing}
            onAsk={(q) => void handleSend(q, null)}
            onRate={(m, v) => void handleRate(m, v)}
          />
        )}

        <Composer
          disabled={disabled || typing}
          canClear={!!active && active.messages.length > 0 && !typing}
          onSend={handleSend}
          onClear={() => setConfirm({ kind: "clear" })}
        />
      </main>

      <PersonaDialog
        open={personaDialogOpen}
        personas={personas}
        onOpenChange={setPersonaDialogOpen}
        onChanged={() => void handlePersonasChanged()}
      />

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "delete" ? "Kustuta vestlus?" : "Tühjenda vestlus?"}
        description={
          confirm?.kind === "delete"
            ? "Vestlus ja kõik selle sõnumid kustutatakse jäädavalt."
            : "Kõik selle vestluse sõnumid kustutatakse. Seaded jäävad alles."
        }
        confirmLabel={confirm?.kind === "delete" ? "Kustuta" : "Tühjenda"}
        onConfirm={() => {
          if (confirm?.kind === "delete") void handleDelete(confirm.id);
          else void handleClear();
        }}
        onOpenChange={(open) => !open && setConfirm(null)}
      />
    </div>
  );
}
