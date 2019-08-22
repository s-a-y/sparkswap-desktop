import request, { RequestMethods } from './request'
import { SwapHash, SwapPreimage, URL } from '../types'
import { isUnknownJSON } from '../fetch-json'

export const USDX = 'USDx'

export interface Balance {
  amount: number,
  currency: 'USDx'
}

// see: https://www.anchorusd.com/9c0cba91e667a08e467f038b6e23e3c4/api/index.html#/?id=the-account-object
export interface Account {
  id: string,
  balances: Balance[]
}

export enum EscrowStatus {
  pending = 'pending',
  canceled = 'canceled',
  complete = 'complete'
}

// see: https://www.anchorusd.com/9c0cba91e667a08e467f038b6e23e3c4/api/index.html#/?id=the-escrow-object
// Note: Hashes and preimages are hex on Anchor, but we use base64. So there needs to be a conversion
// prior to sending to the Anchor API or receiving from it.
export interface Escrow {
  id: string,
  created: Date,
  user: string,
  recipient: string,
  amount: number,
  currency: 'USDx',
  status: EscrowStatus,
  timeout: Date,
  hash: SwapHash,
  preimage?: SwapPreimage
}

interface ListEscrowsResponse {
  items: Escrow[],
  next_page?: string
}

export interface DepositIntentResponse {
  type: string,
  url: string,
  identifier: string,
  api_key: string
}

function keyToStatus (key: unknown): EscrowStatus {
  const statusStr = key as string

  if (!(statusStr in EscrowStatus)) {
    throw new Error(`Invalid escrow status: ${statusStr}`)
  }

  return EscrowStatus[statusStr as keyof typeof EscrowStatus]
}

function base64ToHex (base64: string): string {
  return Buffer.from(base64, 'base64').toString('hex')
}

function hexToBase64 (hex: string): string {
  return Buffer.from(hex, 'hex').toString('base64')
}

function resToEscrow (res: unknown): Escrow {
  if (!isUnknownJSON(res)) {
    throw new Error(`Invalid escrow response: ${res}`)
  }

  if (res.currency !== 'USDx') {
    throw new Error(`Invalid escrow currency: ${res.currency}`)
  }

  return {
    id: res.id as string,
    created: new Date(res.created as number * 1000),
    user: res.user as string,
    recipient: res.recipient as string,
    amount: res.amount as number,
    currency: 'USDx',
    status: keyToStatus(res.status),
    timeout: new Date(res.timeout as number * 1000),
    hash: hexToBase64(res.hash as string),
    preimage: res.preimage ? hexToBase64(res.preimage as string) : undefined
  }
}

export async function getOwnAccount (apiKey: string): Promise<Account> {
  const account = await request(apiKey, '/api/account')

  // TODO: runtime checking of response object
  return account as unknown as Account
}

export async function getEscrow (apiKey: string, id: string): Promise<Escrow> {
  return resToEscrow(await request(apiKey, `/api/escrow/${id}`))
}

async function listEscrowsByHash (apiKey: string, hash: SwapHash, limit = 200): Promise<Escrow[]> {
  const {
    next_page,
    items
  } = (await request(apiKey, '/api/escrows', { hash: base64ToHex(hash) })) as unknown as ListEscrowsResponse

  // eslint-disable-next-line
  let nextPage = next_page

  while (items.length < limit && nextPage) {
    const res = (await request(apiKey, nextPage)) as unknown as ListEscrowsResponse
    items.push(...res.items)
    nextPage = res.next_page
  }

  return items.slice(0, limit).map(resToEscrow)
}

export async function getEscrowByHash (apiKey: string, hash: SwapHash, userId?: string, recipientId?: string): Promise<Escrow | null> {
  const escrows = await listEscrowsByHash(apiKey, hash, 2)
  if (escrows.length > 1) {
    throw new Error(`More than one escrow with the provided hash: ${hash}`)
  }

  if (escrows.length === 0) {
    return null
  }

  const escrow = escrows[0]

  if (userId && escrow.user !== userId) {
    return null
  }

  if (recipientId && escrow.recipient !== recipientId) {
    return null
  }

  return escrow
}

export async function cancelEscrow (apiKey: string, id: string): Promise<void> {
  await request(apiKey, `/api/escrows/${id}`, {}, RequestMethods.DELETE)
}

export async function createEscrow (apiKey: string, hash: SwapHash, recipientId: string,
  amount: number, expiration: Date): Promise<Escrow> {
  const res = await request(
    apiKey,
    `/api/escrow`,
    {
      hash: base64ToHex(hash),
      recipient: recipientId,
      amount,
      timeout: Math.floor(expiration.getTime() / 1000)
    },
    RequestMethods.POST
  )

  return resToEscrow(res)
}

export async function createDepositIntent (apiKey: string, email: string): Promise<DepositIntentResponse> {
  const query = {
    asset_code: 'USD', // eslint-disable-line
    email_address: email // eslint-disable-line
  }

  // We make a request here with no validations because the anchor API will return
  // a 403.
  //
  // The 403 response is to be interpreted as:
  // "Thank you for making an API request to try to create a deposit. Anchor can't
  // create the deposit/return 200 because their deposits require user interaction
  // to be confirmed. Sparkswap needs to send the user to the given URL to complete
  // the deposit interactively."
  const response = await request(apiKey, '/transfer/deposit', query, RequestMethods.GET, { ignoreCodes: [403] })
  return response as unknown as DepositIntentResponse
}

export interface AnchorKyc extends Record<string, string> {
  'name': string,
  'birthday[year]': string,
  'birthday[month]': string,
  'birthday[day]': string,
  'tax-country': string,
  'tax-id-number': string,
  'address[street-1]': string,
  'address[city]': string,
  'address[postal-code]': string,
  'address[region]': string,
  'address[country]': string,
  'primary-phone-number': string,
  'gender': string
}

export interface RegisterResponse {
  url: URL,
  account_id: string
}

// note: the apiKey is not required for this request
export async function register (apiKey: string, identifier: string,
  kycData: AnchorKyc): Promise<RegisterResponse> {
  const data = Object.assign({ identifier }, kycData)
  const response = await request(apiKey, '/api/register',
    data, RequestMethods.POST)
  return response as unknown as RegisterResponse
}

export async function completeEscrow (apiKey: string, id: string, preimage: SwapPreimage): Promise<void> {
  const data = { preimage: base64ToHex(preimage) }
  await request(apiKey, `/api/escrow/${id}/complete`, data, RequestMethods.POST)
}
