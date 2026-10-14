/** Thrown when the deployment has no identity delegation credentials */
export class DelegationNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DelegationNotConfiguredError";
  }
}

/**
 * Asks the integration's server whether the author has a delegated Uniform session.
 * Throws DelegationNotConfiguredError when the deployment isn't set up for delegation,
 * because asking the dashboard for a session token won't help then.
 */
export async function checkDelegationStatus(): Promise<boolean> {
  const response = await fetch("/api/delegation/status", { cache: "no-store" });
  if (response.status === 503) {
    const body = await response.json().catch(() => undefined);
    throw new DelegationNotConfiguredError(
      body?.message || "Adding assets to Uniform isn't available."
    );
  }
  return response.ok;
}
