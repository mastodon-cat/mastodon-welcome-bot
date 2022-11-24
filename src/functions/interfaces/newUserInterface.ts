export interface NewUser {
  event: string
  created_at: string
  object: Object
}

export interface Object {
  id: string
  username: string
  domain: any
  created_at: string
  email: string
  ip: string
  role: Role
  confirmed: boolean
  suspended: boolean
  silenced: boolean
  sensitized: boolean
  disabled: boolean
  approved: boolean
  locale: string
  invite_request: any
  ips: Ip[]
  account: Account
}

export interface Role {
  id: number
  name: string
  color: string
  position: number
  permissions: number
  highlighted: boolean
  created_at: string
  updated_at: string
}

export interface Ip {
  ip: string
  used_at: string
}

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