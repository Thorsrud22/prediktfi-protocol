export function PostHogProvider({ children }: { children: unknown }) {
  return children;
}

export function usePostHog() {
  return {
    capture: () => undefined,
  };
}
