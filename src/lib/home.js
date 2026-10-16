// Role-based landing screen. The role comes from the server, never from the app.
export function roleOf(user) {
  if (!user) return 'user';
  if (user.role) return user.role;
  return user.is_admin ? 'admin' : 'user';
}

export function homeFor(user) {
  const role = roleOf(user);
  if (role === 'admin') return '/dashboard';
  if (role === 'professional') return '/application';
  return '/today';
}
