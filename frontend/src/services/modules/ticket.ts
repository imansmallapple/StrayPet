// src/services/modules/ticket.ts
import http from '@/services/http'

const BASE = '/pet/ticket/'

export type Ticket = {
  id: number
  title: string
  description?: string
  status?: 'open' | 'in_progress' | 'closed' | 'resolved' | string
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string
  created_by?: { id?: number; username?: string } | number
  created_at?: string
  updated_at?: string
  category?: string
  email?: string
  phone?: string
}

export type TicketCreatePayload = {
  title: string
  description?: string
  priority?: string
  category?: string
  email?: string
  phone?: string
}

export type PageResp<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const ticketApi = {
  list: (params?: { page?: number; page_size?: number; status?: string }) =>
    http.get<PageResp<Ticket>>(BASE, { params }),

  retrieve: (id: number) =>
    http.get<Ticket>(`${BASE}${id}/`),

  create: (data: TicketCreatePayload) =>
    http.post<Ticket>(BASE, data),

  update: (id: number, data: Partial<TicketCreatePayload>) =>
    http.patch<Ticket>(`${BASE}${id}/`, data),

  remove: (id: number) =>
    http.delete(`${BASE}${id}/`),

  myTickets: (params?: { page?: number; page_size?: number }) =>
    http.get<PageResp<Ticket>>(`${BASE}my_tickets/`, { params }),
}
