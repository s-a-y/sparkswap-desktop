declare module 'lnd-engine' {
  type SwapHash = string
  type SwapPreimage = string

  class SettledSwapError extends Error {}
  class CanceledSwapError extends Error {}
  class ExpiredSwapError extends Error {}
  class PermanentSwapError extends Error {}

  enum Statuses {
    UNKNOWN = 'UNKNOWN',
    NO_CONFIG = 'NO_CONFIG',
    LOCKED = 'LOCKED',
    NEEDS_WALLET = 'NEEDS_WALLET',
    UNAVAILABLE = 'UNAVAILABLE',
    UNLOCKED = 'UNLOCKED',
    NOT_SYNCED = 'NOT_SYNCED',
    VALIDATED = 'VALIDATED',
  }

  enum Errors {
    SettledSwapError,
    CanceledSwapError,
    ExpiredSwapError,
    PermanentSwapError
  }

  class LndEngine {
    static readonly STATUSES: {
      UNKNOWN: Statuses,
      NO_CONFIG: Statuses,
      LOCKED: Statuses,
      NEEDS_WALLET: Statuses,
      UNAVAILABLE: Statuses,
      UNLOCKED: Statuses,
      NOT_SYNCED: Statuses,
      VALIDATED: Statuses
    }

    static readonly ERRORS: {
      SettledSwapError: typeof SettledSwapError,
      CanceledSwapError: typeof CanceledSwapError,
      ExpiredSwapError: typeof ExpiredSwapError,
      PermanentSwapError: typeof PermanentSwapError
    }

    constructor(host: string, symbol: string, options: { tlsCertPath: string, macaroonPath: string })

    host: string
    tlsCertPath: string
    macaroonPath: string
    status: Statuses
    maxChannelBalance: number

    validateEngine (): Promise<void>
    waitForSwapCommitment (hash: SwapHash): Promise<Date>
    getSettledSwapPreimage (hash: SwapHash): Promise<SwapPreimage>
    translateSwap (address: string, hash: SwapHash, amount: string, maxTime: Date): Promise<SwapPreimage>
    initiateSwap (address: string, hash: SwapHash, amount: string, maxTimeLock: number, finalDelta: number): Promise<SwapPreimage>
    cancelSwap (hash: SwapHash): Promise<void>
    settleSwap (preimage: SwapPreimage): Promise<void>
    prepareSwap (hash: SwapHash, amount: string, timeout: Date, finalCltvDelta: number): Promise<void>
    getPaymentChannelNetworkAddress (): Promise<string>
    connectUser (pubkey: string): Promise<void>
    createChannels (pubkey: string, amount: number): Promise<void>
    getUncommittedBalance (): Promise<string>
    getTotalChannelBalance (): Promise<string>
    getTotalPendingChannelBalance (): Promise<string>
    getUncommittedPendingBalance (): Promise<string>
    getStatus (): Promise<Statuses>
  }

  export default LndEngine
}
