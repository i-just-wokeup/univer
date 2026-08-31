export type BotConfig = {
  adminChatId: string;
  adminUserId: string;
  botToken: string;
  webhookSecret: string;
};

export function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function getBotConfig(): BotConfig {
  return {
    adminChatId: getRequiredEnv("TELEGRAM_ADMIN_CHAT_ID"),
    adminUserId: getRequiredEnv("TELEGRAM_ADMIN_USER_ID"),
    botToken: getRequiredEnv("TELEGRAM_BOT_TOKEN"),
    webhookSecret: getRequiredEnv("TELEGRAM_WEBHOOK_SECRET"),
  };
}
