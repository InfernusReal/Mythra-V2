"use client";

import { useEffect } from "react";
import { registerCommandHandlers, type CommandHandler } from "./runtime";

/** The owning component supplies existing actions; unmounting removes availability. */
export function useCommandHandlers(handlers: readonly CommandHandler[]): void {
  useEffect(() => registerCommandHandlers(handlers), [handlers]);
}
