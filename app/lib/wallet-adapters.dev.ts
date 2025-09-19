// Dev stub for react-native imports used by wallet adapters.
// This prevents bundling actual react-native and avoids build errors in Next dev.
export const Platform = { OS: 'web' } as const;
export const NativeModules: Record<string, unknown> = {};
export const Linking = {
  openURL: async (_url: string) => false,
  addEventListener: () => ({ remove: () => {} }),
};
export default {};
