import { useStore, AppState } from '../store';

/**
 * Hook to access store state safely.
 * Usage: const issues = useSafeStore(state => state.issues);
 */
export const useSafeStore = <T>(selector: (state: AppState) => T): T => {
  return useStore(selector);
};

// Example usage to fetch safely:
// const issues = useSafeStore(state => safeArray(state.issues));
