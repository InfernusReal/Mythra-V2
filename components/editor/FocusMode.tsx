"use client";

export function FocusMode({ active, onChange }: { active: boolean; onChange(): void }) {
  return <button onClick={onChange} aria-pressed={active}>Focus</button>;
}
