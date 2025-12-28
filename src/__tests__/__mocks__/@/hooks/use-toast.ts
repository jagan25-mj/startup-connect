import { vi } from 'vitest';

const toastMock = vi.fn();

export const toast = toastMock;

export function useToast() {
  return {
    toast: toastMock,
  };
}