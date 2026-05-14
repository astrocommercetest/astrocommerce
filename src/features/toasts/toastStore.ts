import { atom } from "nanostores";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const toasts = atom<Toast[]>([]);

export function removeToast(id: string) {
  toasts.set(toasts.get().filter((t) => t.id !== id));
}

export const toast = {
  success: (message: string) => addToast(message, "success"),
  error:   (message: string) => addToast(message, "error"),
  info:    (message: string) => addToast(message, "info"),
  warning: (message: string) => addToast(message, "warning"),
};

function addToast(message: string, type: ToastType) {
  const id = crypto.randomUUID();
  toasts.set([...toasts.get(), { id, message, type }]);
}
