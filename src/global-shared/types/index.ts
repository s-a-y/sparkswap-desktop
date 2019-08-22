// SwapHashes are 32 byte SHA-256 hashes encoded as Base64 strings
export type SwapHash = string
// SwapPreimages are 32 bytes of randomness encoded as Base64 strings
export type SwapPreimage = string
export type URL = string

export type PaymentChannelNetworkAddress = string

export enum Asset {
  BTC = 'BTC',
  USDX = 'USDX'
}

const assetEntries = Object.entries(Asset)

export function valueToAsset (str: string): Asset {
  for (let i = 0; i < assetEntries.length; i++) {
    if (assetEntries[i][1] === str) {
      return Asset[assetEntries[i][0] as keyof typeof Asset]
    }
  }
  throw new Error(`${str} is not a valid value for Asset`)
}

export enum Unit {
  Cent = 'cent',
  Satoshi = 'satoshi'
}

const unitEntries = Object.entries(Unit)

export function valueToUnit (str: string): Unit {
  for (let i = 0; i < unitEntries.length; i++) {
    if (unitEntries[i][1] === str) {
      return Unit[unitEntries[i][0] as keyof typeof Unit]
    }
  }
  throw new Error(`${str} is not a valid value for Unit`)
}

const assetsToUnits = Object.freeze({
  [Asset.BTC]: Unit.Satoshi,
  [Asset.USDX]: Unit.Cent
})

export function assetToUnit (asset: Asset): Unit {
  return assetsToUnits[asset]
}

export interface Amount {
  asset: Asset,
  unit: Unit,
  value: number
}

export enum ReviewStatus {
  UNCREATED = 'UNCREATED',
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

const reviewStatuses = Object.values(ReviewStatus)

export function isReviewStatus (str: string): str is ReviewStatus {
  return reviewStatuses.includes(str)
}
