import { FC } from 'react';

/**
 * Represents a single navigation tab item
 */
export interface NavTabItem {
  id: string;
  label: string;
  Icon: FC<{ width: number; height: number; color?: string }>;
  SelectedIcon?: FC<{ width: number; height: number }>;
  /** Adjustment for tabs with wider labels like "AI Coach" */
  indicatorWidthAdjustment?: number;
  /** Badge count to display on this tab */
  badge?: number;
}

/**
 * AI Assistant option for dropdown menu
 */
export interface AIAssistantOption {
  id: 'clara' | 'ray';
  name: string;
  description: string;
  Icon: FC<{ width: number; height: number }>;
}

/**
 * FAB (Floating Action Button) configuration
 */
export interface FABConfig {
  enabled: boolean;
  Icon: FC<{ width: number; height: number }>;
  onPress?: () => void;
  /** Enable dropdown menu for AI assistant selection */
  showDropdown?: boolean;
  /** AI assistant options for dropdown */
  assistantOptions?: AIAssistantOption[];
  /** Callback when an AI assistant is selected */
  onSelectAssistant?: (assistantId: 'clara' | 'ray') => void;
}

/**
 * Main props interface for AppNavBar
 */
export interface AppNavBarProps {
  /** Tab configuration array */
  tabs: NavTabItem[];
  /** Currently active tab ID */
  activeTab?: string;
  /** Callback when a tab is pressed */
  onTabPress?: (tabId: string) => void;
  /** FAB configuration (optional) */
  fab?: FABConfig;
}
