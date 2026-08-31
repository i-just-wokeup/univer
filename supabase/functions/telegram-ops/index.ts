import { getCommandHandler, normalizeCommand } from "./commands/index.ts";
import { getBotConfig } from "./config.ts";
import { createOpsClient } from "./supabase.ts";
import { sendTelegramMessage } from "./telegram.ts";
import type { TelegramUpdate } from "./types.ts";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

Deno.serve(async (request) => {
  try {
    const config = getBotConfig();

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const requestSecret = request.headers.get(
      "X-Telegram-Bot-Api-Secret-Token",
    );

    if (requestSecret !== config.webhookSecret) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;

    if (!message?.from || !message.text) {
      return jsonResponse({ ok: true });
    }

    if (
      String(message.from.id) !== config.adminUserId ||
      String(message.chat.id) !== config.adminChatId
    ) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const command = normalizeCommand(message.text);
    const handler = getCommandHandler(command);
    const supabase = createOpsClient();
    const reply = await handler({ supabase });

    await sendTelegramMessage(
      config.botToken,
      config.adminChatId,
      reply,
    );

    return jsonResponse({ ok: true, updateId: update.update_id });
  } catch (error) {
    console.error("telegram-ops error", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
