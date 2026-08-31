export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
) {
  let response: Response;

  try {
    response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        body: JSON.stringify({ chat_id: chatId, text }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
  } catch {
    // Fetch errors can include the request URL, which contains the bot token.
    throw new Error("Telegram sendMessage request failed");
  }

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: ${response.status}`);
  }
}
