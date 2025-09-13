// Re-export from the enhanced wallet-intent-persistence module
export {
  type TradingIntent,
  loadIntents as getIntents,
  saveIntents,
  upsertIntent,
  removeIntent,
  clearIntents,
  getWalletKeysWithIntents
} from './wallet-intent-persistence';
