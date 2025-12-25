// src/services/modules/blog.ts
import http from '@/services/http'

export type Category = {
  id: number
  name: string
  parent?: number | null
  sort: number
  add_date: string
  pub_date: string
}

export type Tag = {
  id: number
  name: string
  add_date: string
  pub_date: string
  article_count?: number
}

export type Article = {
  id: number
  title: string
  description: string
  content: string
  toc: string
  category: string
  tags: string[]
  count: number
  add_date: string
  pub_date: string
  author_username?: string
  is_favorited?: boolean
}

export type ArticleListItem = {
  id: number
  title: string
  description: string
  category: string
  tags: string[]
  count: number
  add_date: string
  pub_date: string
  author_username?: string
  is_favorited?: boolean
}

export type ArchiveItem = {
  year: number
  month: number
  count: number
}

export type PageResp<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Comment = {
  id: number
  content: string
  parent?: number | null
  user: {
    id: number
    username: string
  }
  add_date: string
  replies?: Comment[]
}

const BASE = '/blog'

export const blogApi = {
  // 分类相关
  listCategories: () => http.get<Category[]>(`${BASE}/category/`),
  
  getCategory: (id: number) => http.get<Category>(`${BASE}/category/${id}/`),
  
  // 标签相关
  listTags: () => http.get<Tag[]>(`${BASE}/tag/`),
  
  getPopularTags: () => http.get<Tag[]>(`${BASE}/tag/popular/`),
  
  // 文章相关
  listArticles: (params?: {
    page?: number
    page_size?: number
    category?: number
    tags?: number
    search?: string
    ordering?: string
  }) => http.get<PageResp<ArticleListItem>>(`${BASE}/article/`, { params }),
  
  getArticle: (id: number) => http.get<Article>(`${BASE}/article/${id}/`),
  
  // 创建和更新文章
  createArticle: (data: {
    title: string
    description?: string
    content: string
    category?: number
    tags?: number[]
  }) => http.post<Article>(`${BASE}/article/`, data),
  
  updateArticle: (id: number, data: {
    title?: string
    description?: string
    content?: string
    category?: number
    tags?: number[]
  }) => http.patch<Article>(`${BASE}/article/${id}/`, data),
  
  // 归档相关
  getArchive: () => http.get<ArchiveItem[]>(`${BASE}/article/archive/`),
  
  getArchiveDetail: (year: number, month: number, params?: {
    page?: number
    page_size?: number
  }) => http.get<PageResp<ArticleListItem>>(`${BASE}/article/${year}/${month}/`, { params }),
  
  // 评论相关
  getComments: (articleId: number, params?: {
    page?: number
    page_size?: number
  }) => http.get<PageResp<Comment>>(`${BASE}/article/${articleId}/comments/`, { params }),
  
  addComment: (articleId: number, data: {
    content: string
    parent?: number
  }) => http.post<Comment>(`${BASE}/article/${articleId}/add_comment/`, data),

  // 我的文章和收藏
  getMyArticles: (params?: {
    page?: number
    page_size?: number
  }) => http.get<PageResp<ArticleListItem>>(`${BASE}/article/my_articles/`, { params }),

  getFavoriteArticles: (params?: {
    page?: number
    page_size?: number
  }) => http.get<PageResp<ArticleListItem>>(`${BASE}/article/favorites/`, { params }),

  favoriteArticle: (articleId: number) => 
    http.post(`${BASE}/article/${articleId}/favorite/`),

  unfavoriteArticle: (articleId: number) => 
    http.post(`${BASE}/article/${articleId}/unfavorite/`),

  // 图片上传
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return http.post<{ url: string; text: string }>(`${BASE}/upload-image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
