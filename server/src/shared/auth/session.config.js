export const authSessionOptions = Object.freeze({
  // Refresh active sessions hourly; sessions expire after 7 days without activity.
  expiresIn: 60 * 60 * 24 * 7,
  updateAge: 60 * 60,
});
