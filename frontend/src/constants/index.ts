export const API_BASE_URL = '/api'
export const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/616/616408.png'

export const NOTE_SORT_OPTIONS = {
  LATEST: 'latest',
  POPULAR: 'popular',
  OLDEST: 'oldest'
} as const

export type NoteSortOption = typeof NOTE_SORT_OPTIONS[keyof typeof NOTE_SORT_OPTIONS]

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  NOTES: '/notes',
  NOTES_DETAIL: '/notes-detail',
  NOTES_CREATE: '/notes-create',
  NOTES_MY: '/notes-my',
  NOTES_ADMIN: '/notes-admin',
  USER: '/user',
  PROFILE_EDIT: '/profile-edit',
  SPOT: '/spot',
  ADMIN: '/admin'
} as const
