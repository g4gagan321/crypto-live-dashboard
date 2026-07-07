import dashboardConfig from '../../config/dashboard.config.json';
import type { DashboardConfig } from '@/types';

// Single source of truth for editable settings. Import this instead of
// reading the JSON file directly so type-safety is enforced everywhere.
export const config = dashboardConfig as unknown as DashboardConfig;

export function isWidgetEnabled(key: string): boolean {
  return Boolean(config.widgets[key]);
}
