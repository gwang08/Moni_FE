export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const scope = payload.scope as string | undefined;
  if (!scope) return null;

  // scope is space-separated list like "ROLE_ADMIN" or "ROLE_USER"
  if (scope.includes('ROLE_ADMIN')) return 'ADMIN';
  if (scope.includes('ROLE_EXPERT')) return 'EXPERT';
  return 'USER';
}
