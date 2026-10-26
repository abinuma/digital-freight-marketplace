export const authSessionOptions = Object.freeze({
  // Refresh active sessions hourly; sessions expire after 24 hours without activity.
  expiresIn: 24 * 60 * 60,
  updateAge: 60 * 60,
});
