export interface InventoryJob {
  syncAll(vehicleCondition?: unknown): Promise<void>;
}
