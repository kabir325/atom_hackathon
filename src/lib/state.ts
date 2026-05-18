import { loadState, saveState } from "@/lib/storage";
import { type AppState } from "@/lib/types";

export function getState(): AppState {
  const state = loadState();
  if (!state) {
    throw new Error("State not initialized");
  }
  if (state.version !== 2) {
    throw new Error("State version not supported");
  }
  return state;
}

export function setState(state: AppState) {
  saveState(state);
}

export function updateState(updater: (prev: AppState) => AppState) {
  const prev = getState();
  const next = updater(prev);
  saveState(next);
  return next;
}
