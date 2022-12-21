import { Account } from "./accountInterface"

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
