import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const CHUNK_SIZE = 2000;

function getCountKey(key: string) {
  return `${key}_n`;
}

function getChunkKey(key: string, index: number) {
  return `${key}_${index}`;
}

async function getSecureItem(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(getCountKey(key));
  if (countRaw === null) {
    return null;
  }

  const count = Number(countRaw);
  if (!Number.isInteger(count) || count < 0) {
    return null;
  }

  let value = "";
  for (let index = 0; index < count; index += 1) {
    const part = await SecureStore.getItemAsync(getChunkKey(key, index));
    if (part === null) {
      return null;
    }
    value += part;
  }

  return value;
}

async function getItem(key: string): Promise<string | null> {
  const secureValue = await getSecureItem(key);
  if (secureValue !== null) {
    return secureValue;
  }

  const legacyValue = await AsyncStorage.getItem(key);
  if (legacyValue === null) {
    return null;
  }

  await setItem(key, legacyValue);
  await AsyncStorage.removeItem(key);
  return legacyValue;
}

async function setItem(key: string, value: string): Promise<void> {
  await removeItem(key);

  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += CHUNK_SIZE) {
    chunks.push(value.slice(index, index + CHUNK_SIZE));
  }

  for (let index = 0; index < chunks.length; index += 1) {
    await SecureStore.setItemAsync(getChunkKey(key, index), chunks[index]);
  }
  await SecureStore.setItemAsync(getCountKey(key), String(chunks.length));
  await AsyncStorage.removeItem(key).catch(() => undefined);
}

async function removeItem(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(getCountKey(key));
  if (countRaw !== null) {
    const count = Number(countRaw);
    if (Number.isInteger(count) && count >= 0) {
      for (let index = 0; index < count; index += 1) {
        await SecureStore.deleteItemAsync(getChunkKey(key, index));
      }
    }
    await SecureStore.deleteItemAsync(getCountKey(key));
  }

  await AsyncStorage.removeItem(key).catch(() => undefined);
}

export const secureStorageAdapter = {
  getItem,
  removeItem,
  setItem,
};
