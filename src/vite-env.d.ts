/// <reference types="vite/client" />

// Vite importGlob types need Worker — polyfill for tsc strict mode
declare class Worker {
  constructor(scriptURL: string | URL, options?: WorkerOptions);
  postMessage(message: unknown): void;
  terminate(): void;
}
