import { NetworkError } from "../../domain/repositories/errors";

export const NETWORK_DELAY_MS = 500;

export interface NetworkSimulator {
  beforeRead(): Promise<void>;
  beforeWrite(): Promise<void>;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isFailureRequested(): boolean {
  return new URLSearchParams(window.location.search).get('fail') === '1';
}

export function createNetworkSimulator(): NetworkSimulator {
  return {
    async beforeRead() {
      await wait(NETWORK_DELAY_MS);
      if (isFailureRequested()) {
        throw new NetworkError('Failed to load data');
      }
    },
    async beforeWrite() {
      await wait(NETWORK_DELAY_MS);
    },
  };
}