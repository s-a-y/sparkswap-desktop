import { LndActionOptions } from '../types/lnd-engine/client'
import { SECONDS_PER_BLOCK } from './config'
import { connectPeer } from './connect-peer'
import {
  parse as parseAddress,
  loggablePubKey,
  isPendingOpenResponse,
  isChannelOpenUpdateResponse
} from './utils'

// Default number of seconds before our first confirmation. (30 minutes)
const DEFAULT_CONFIRMATION_DELAY = 1800

export interface CreateChannelOptions {
  targetTime?: number,
  privateChan?: boolean
}

export async function createChannel (paymentChannelNetworkAddress: string, fundingAmount: number, {
  targetTime = DEFAULT_CONFIRMATION_DELAY,
  privateChan = false
}: CreateChannelOptions,
{ client, logger }: LndActionOptions): Promise<void> {
  const targetConf = Math.max(Math.floor(targetTime / SECONDS_PER_BLOCK), 1)
  const { publicKey, host } = parseAddress(paymentChannelNetworkAddress)
  const loggablePublicKey = loggablePubKey(publicKey)

  logger.debug(`Attempting to create a channel with ${loggablePublicKey}`)

  if (host) {
    await connectPeer(publicKey, host, { client, logger })
  } else {
    logger.debug(`Skipping connect peer. Host is missing for pubkey ${loggablePublicKey}`)
  }

  logger.debug(`Successfully connected to peer: ${loggablePublicKey}`)

  return new Promise((resolve, reject) => {
    try {
      const call = client.openChannel({
        nodePubkey: Buffer.from(publicKey, 'hex').toString('base64'),
        localFundingAmount: fundingAmount,
        targetConf,
        private: privateChan
      })

      call.on('data', data => {
        if (isPendingOpenResponse(data)) {
          return resolve()
        }

        if (isChannelOpenUpdateResponse(data)) {
          return resolve()
        }
      })

      call.on('error', reject)
    } catch (e) {
      reject(e)
    }
  })
}
