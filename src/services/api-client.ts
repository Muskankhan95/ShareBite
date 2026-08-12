/**
 * Thin API/data-access boundary.
 *
 * The backend (database, auth, storage) is not connected yet. Every service
 * call funnels through here so that wiring a real backend later only requires
 * changing this file and the service implementations — never the UI.
 */

export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not available yet — backend not connected.`);
    this.name = "NotImplementedError";
  }
}

export async function notImplemented<T>(feature: string): Promise<T> {
  throw new NotImplementedError(feature);
}
