import type { Access, FieldAccess } from 'payload'

export type Role = 'admin' | 'editor'

/** Check if the logged-in user has one of the given roles */
export const hasRole =
  (...roles: Role[]): Access =>
  ({ req: { user } }) => {
    if (!user) return false
    return roles.includes(user.role as Role)
  }

/** Check if the logged-in user has one of the given roles (field-level) */
export const hasRoleField =
  (...roles: Role[]): FieldAccess =>
  ({ req: { user } }) => {
    if (!user) return false
    return roles.includes(user.role as Role)
  }

/** Admin-only access */
export const isAdmin: Access = hasRole('admin')

/** Admin or editor */
export const isAdminOrEditor: Access = hasRole('admin', 'editor')

/** Any authenticated admin panel user */
export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

/** Anyone can read */
export const publicRead: Access = () => true

/** Unauthenticated users can only see published documents; authenticated users see all */
export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}
