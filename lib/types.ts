import type { ReminderConfig } from '@/lib/reminder'

export type Category = 'immobilier' | 'residences' | 'terrains' | 'auto' | 'opportunite'

export type Verification = 'unverified' | 'phone_ok' | 'verified' | 'exclusive'
export type Pipeline = 'captured' | 'contacting' | 'visit' | 'negotiation' | 'closing' | 'won' | 'lost'
export type Source = 'paste' | 'link' | 'voice' | 'photo' | 'manual'
export type DemandStatus = 'open' | 'paused' | 'won' | 'dropped'
export type ContactKind = 'contact' | 'client'

export type Profile = {
  id: string
  pseudo: string
  display_name: string | null
  created_at: string
  push_token?: string | null
  notify_appointments?: boolean
  notify_demands?: boolean
  notify_agenda_minutes?: number
}

export type SocialLink = {
  url: string
  type: string
}

export type Contact = {
  id: string
  user_id: string
  name: string
  phone: string | null
  phones: string[]
  device_contact_id: string | null
  localisation: string | null
  secteur: string | null
  specialite: string | null
  whatsapp: string | null
  facebook: string | null
  instagram: string | null
  tiktok: string | null
  notes: string | null
  kind: ContactKind
  created_at: string
  updated_at: string
}

export type DirectoryPerson = {
  id: string
  name: string
  phone: string | null
  fromApp?: boolean
}

export type Offer = {
  id: string
  user_id: string
  title: string
  category: Category
  price: number
  currency: string
  commission_rate: number
  location: string | null
  size_label: string | null
  size_value: number | null
  rooms: number | null
  visite: number | null
  visite_text: string | null
  phones: string[]
  links: SocialLink[]
  tags: string[]
  is_new: boolean
  description: string | null
  raw_text: string | null
  source_url: string | null
  source: Source
  phone: string | null
  contact_id: string | null
  verification: Verification
  pipeline: Pipeline
  reliability: number
  map_lat: number | null
  map_lng: number | null
  map_label: string | null
  last_touched_at: string
  collected_commission: number | null
  important: boolean
  extracted: Record<string, unknown> | null
  created_at: string
  updated_at: string
  contact?: Contact | null
}

export type Demand = {
  id: string
  user_id: string
  title: string
  category: Category
  location: string | null
  budget_min: number | null
  budget_max: number | null
  currency: string
  size_min: number | null
  notes: string | null
  contact_id: string | null
  status: DemandStatus
  reminder?: ReminderConfig | null
  created_at: string
  updated_at: string
  contact?: Contact | null
}

export type MatchReason = {
  code: string
  label: string
  points: number
}

export type MatchRow = {
  id: string
  user_id: string
  offer_id: string
  demand_id: string
  score: number
  reasons: MatchReason[]
  created_at: string
  updated_at: string
  offer?: Offer | null
  demand?: Demand | null
}

export type HuntAction = {
  id: string
  title: string
  reason: string
  kind: 'match' | 'relance' | 'verify' | 'demand' | 'contact'
  offerId?: string
  demandId?: string
}

export type AppointmentKind = 'affaire' | 'visite'

export type Appointment = {
  id: string
  user_id: string
  kind: AppointmentKind
  title: string
  starts_at: string
  place: string | null
  notes: string | null
  contact_id: string | null
  offer_id: string | null
  demand_id: string | null
  map_lat: number | null
  map_lng: number | null
  map_label: string | null
  reminder?: ReminderConfig | null
  created_at: string
  updated_at: string
  contact?: Contact | null
}

export type CashEntry = {
  id: string
  user_id: string
  sale_amount: number
  received_amount: number
  commission: number
  note: string | null
  occurred_at: string
  created_at: string
}

export type FormKind = 'offer' | 'offer-edit' | 'demand' | 'contact' | 'client' | 'settings' | 'appointment'
