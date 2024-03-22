export interface InventoryJob {
  syncAll(vehicleCondition?: unknown): Promise<void>;
  getPages(condition?: string): Promise<number | number[]>;
}
