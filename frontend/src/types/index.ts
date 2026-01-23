/**
 * 类型定义文件
 * 对应后端 Java DTO 和实体类
 */

// ==================== 枚举类型 ====================

export enum NoteStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  PRIVATE = 'PRIVATE',
}

// ==================== DTO 类型 ====================

export interface UserDTO {
  id: number
  username: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  location?: string
  avatarUrl?: string
  bio?: string
  address?: string
  birthday?: string // LocalDate 转换为字符串
  createdAt?: string // LocalDateTime 转换为字符串
  notesCount?: number
  likesCount?: number
  favoritesCount?: number
  totalLikesAndFavorites?: number
}

export interface NotesDTO {
  id: number
  title: string
  content: string
  imageUrl?: string // 兼容旧版本：单张图片URL
  imageUrls?: string[] // 新版本：多张图片URL列表
  location?: string
  likesCount?: number
  favoritesCount?: number
  status?: NoteStatus
  rejectReason?: string
  submittedAt?: string // LocalDateTime 转换为字符串
  reviewedAt?: string // LocalDateTime 转换为字符串
  reviewedByUsername?: string
  isApproved?: boolean // 保留字段，用于向后兼容
  createdAt?: string // LocalDateTime 转换为字符串
  updatedAt?: string // LocalDateTime 转换为字符串
  username?: string // 作者用户名
  isLiked?: boolean // 当前用户是否已点赞
  isFavorited?: boolean // 当前用户是否已收藏
}

export interface Spot {
  id: number
  name: string
  description?: string
  location?: string
  imageUrl?: string
  likes: number
  favorites: number
  createdAt?: string // LocalDateTime 转换为字符串
}

export interface NotificationDTO {
  id: number
  type: string
  title: string
  content: string
  relatedId?: number
  isRead: boolean
  createdAt: string // LocalDateTime 转换为字符串
}

// ==================== 请求类型 ====================

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface LoginResponse {
  token: string
  username: string
  role: string
  message?: string
}

export interface CreateNotesRequest {
  title: string
  content: string
  imageUrl?: string // 兼容旧版本：单张图片或JSON数组字符串
  imageUrls?: string[] // 新版本：多张图片路径列表
  location?: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  avatarUrl?: string
  bio?: string
  location?: string
  address?: string
  birthday?: string // LocalDate 转换为字符串
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export interface ActionResponse {
  success: boolean
  message?: string
}

// ==================== 工具类型 ====================

export interface AuthStatus {
  authenticated: boolean
  user?: UserDTO
  reason?: 'NO_TOKEN' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'NETWORK_ERROR'
  error?: Error
}

export interface TokenPayload {
  sub?: string
  username?: string
  role?: string
  exp?: number
  iat?: number
  [key: string]: any
}

export interface LocationCoordinates {
  lat: number
  lng: number
}

export interface FileUploadResponse {
  url: string
  filename: string
  size?: number
}

// ==================== 统计类型 ====================

export interface AdminNotesStats {
  pendingNotes: number
  totalNotes?: number
  publishedNotes?: number
  rejectedNotes?: number
}
