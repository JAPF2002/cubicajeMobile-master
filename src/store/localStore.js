// src/store/localStore.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@cubicaje/state-v1";

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("loadState error", err);
    return null;
  }
}

export async function saveState(state) {
  try {
    const raw = JSON.stringify(state);
    await AsyncStorage.setItem(STORAGE_KEY, raw);
  } catch (err) {
    console.warn("saveState error", err);
  }
}

export async function clearState() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("clearState error", err);
  }
}
