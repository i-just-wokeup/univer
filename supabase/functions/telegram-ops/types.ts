export type TelegramChat = {
  id: number;
};

export type TelegramUser = {
  id: number;
};

export type TelegramMessage = {
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
};

export type TelegramUpdate = {
  message?: TelegramMessage;
  update_id: number;
};
