export interface HydrationOptions {
  containerId?: string;
  onHydrated?: () => void;
  shouldWaitForData?: boolean;
}
