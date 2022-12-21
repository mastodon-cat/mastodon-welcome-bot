export interface Account {
  id: string
  username: string
  acct: string
  display_name: string
  locked: boolean
  bot: boolean
  discoverable: any
  group: boolean
  created_at: string
  note: string
  url: string
  avatar: string
  avatar_static: string
  header: string
  header_static: string
  followers_count: number
  following_count: number
  statuses_count: number
  last_status_at: any
  noindex: boolean
  emojis: any[]
  fields: any[]
}