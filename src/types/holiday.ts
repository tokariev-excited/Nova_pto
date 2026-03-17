export interface Holiday {
  id: string
  workspace_id: string
  name: string
  date: string
  is_custom: boolean
  country_code: string | null
  year: number | null
  created_at: string
  updated_at: string
}

export interface NagerHoliday {
  date: string
  localName: string
  name: string
  countryCode: string
  fixed: boolean
  global: boolean
  types: string[]
}

export interface CreateHolidayData {
  workspace_id: string
  name: string
  date: string
  is_custom: boolean
  country_code?: string | null
  year?: number | null
}
