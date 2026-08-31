import { helpCommand, unknownCommand } from "./help.ts";
import { reportsCommand } from "./reports.ts";
import { statusCommand } from "./status.ts";
import { todayCommand } from "./today.ts";
import type { CommandHandler } from "./types.ts";
import { uploadsCommand } from "./uploads.ts";
import { usersCommand } from "./users.ts";

const COMMAND_HANDLERS: Readonly<Record<string, CommandHandler>> = {
  "/help": helpCommand,
  "/reports": reportsCommand,
  "/start": helpCommand,
  "/status": statusCommand,
  "/today": todayCommand,
  "/uploads": uploadsCommand,
  "/users": usersCommand,
};

export function normalizeCommand(text: string): string {
  return text.trim().split(/\s+/u)[0]?.split("@")[0]?.toLowerCase() ?? "";
}

export function getCommandHandler(command: string): CommandHandler {
  return COMMAND_HANDLERS[command] ?? unknownCommand;
}
