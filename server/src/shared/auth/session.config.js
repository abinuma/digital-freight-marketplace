export const authSessionOptions = Object.freeze({
  // Refresh active sessions hourly; sessions expire after 24 hours without activity.
  expiresIn: 60 * 60 * 24,
  updateAge: 60 * 60,
});
