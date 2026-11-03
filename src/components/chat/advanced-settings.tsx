"use client";

import { useEffect, useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AdvancedSettingsProps {
  temperature: number;
  topP: number;
  disabled: boolean;
  onCommit: (values: { temperature?: number; topP?: number }) => void;
}

export function AdvancedSettings({ temperature, topP, disabled, onCommit }: AdvancedSettingsProps) {
  const [open, setOpen] = useState(false);
  // Local values give live feedback while dragging; the chat is saved on release.
  const [temp, setTemp] = useState(temperature);
  const [top, setTop] = useState(topP);

  useEffect(() => setTemp(temperature), [temperature]);
  useEffect(() => setTop(topP), [topP]);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="border-b border-zinc-200 bg-white">
      <Collapsible.Trigger className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50">
        <SlidersHorizontal className="size-4 text-zinc-400" />
        Täpsemad seaded
        <span className="text-xs font-normal text-zinc-400">(demoseade)</span>
        <ChevronDown className={`ml-auto size-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </Collapsible.Trigger>
      <Collapsible.Content className="px-4 pb-4">
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <SliderField
            label="Temperature"
            value={temp}
            disabled={disabled}
            onChange={setTemp}
            onCommit={(v) => onCommit({ temperature: v })}
          />
          <SliderField label="Top-P" value={top} disabled={disabled} onChange={setTop} onCommit={(v) => onCommit({ topP: v })} />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Kui Temperature on vähemalt 0.7, näitab Oskar vastuse all kahte seotud küsimust samast teemast.
        </p>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
}

function SliderField({ label, value, disabled, onChange, onCommit }: SliderFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700">{label}</span>
        <span className="rounded-md bg-violet-50 px-2 py-0.5 font-mono text-xs text-violet-700">{value.toFixed(1)}</span>
      </div>
      <Slider
        min={0}
        max={1}
        step={0.1}
        value={[value]}
        disabled={disabled}
        aria-label={label}
        onValueChange={([v]) => onChange(v)}
        onValueCommit={([v]) => onCommit(v)}
      />
    </div>
  );
}
