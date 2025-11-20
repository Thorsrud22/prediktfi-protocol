// Mock analytics functions for testing
export const trackServer = (_event: string, _data?: unknown) => {
  // Mock server-side analytics tracking
  return Promise.resolve();
};
