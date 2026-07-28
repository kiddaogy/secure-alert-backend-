export type Role = 'ADMIN' | 'POLICE' | 'OWNER'
export type LocationType = 'SHOP' | 'HOME'
export type AlertStatus = 'PENDING' | 'RESPONDING' | 'RESOLVED' | 'FALSE_ALARM'
export type DeviceStatus = 'ONLINE' | 'OFFLINE'

export interface User {
  id: string
  fullName: string
  email: string
  phone: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Location {
  id: string
  name: string
  address: string
  type: LocationType
  policeStation: string
  latitude?: string
  longitude?: string
  pairingCode: string
  ownerId: string
  owner?: User
  device?: Device
  alerts?: Alert[]
  createdAt: Date
  updatedAt: Date
}

export interface Device {
  id: string
  deviceId: string
  status: DeviceStatus
  lastSeen?: Date
  locationId: string
  location?: Location
  alerts?: Alert[]
  createdAt: Date
  updatedAt: Date
}

export interface Alert {
  id: string
  status: AlertStatus
  triggeredAt: Date
  respondedAt?: Date
  resolvedAt?: Date
  notes?: string
  deviceId: string
  device?: Device
  locationId: string
  location?: Location
  createdAt: Date
  updatedAt: Date
}

export interface JWTPayload {
  id: string
  email: string
  role: Role
  fullName: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
