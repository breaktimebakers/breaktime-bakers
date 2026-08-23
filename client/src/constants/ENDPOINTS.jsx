// Central map of backend API route paths, grouped by feature.
// Query/mutation hooks import from here instead of hardcoding strings,
// so a path only ever needs to change in one place.
export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh-token',
    me: '/auth/me',
  },
}
