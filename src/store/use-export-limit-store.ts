/**
 * Export Limit Store
 * 
 * Tracks anonymous export count for freemium model.
 * Anonymous users get 3 free CSR exports, then require login.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const FREE_EXPORT_LIMIT = 3;

interface ExportLimitState {
    anonymousExportCount: number;

    // Actions
    canExportAnonymously: () => boolean;
    incrementExportCount: () => void;
    getRemainingExports: () => number;
    resetExportCount: () => void;
}

export const useExportLimitStore = create<ExportLimitState>()(
    persist(
        (set, get) => ({
            anonymousExportCount: 0,

            canExportAnonymously: () => {
                return get().anonymousExportCount < FREE_EXPORT_LIMIT;
            },

            incrementExportCount: () => {
                set((state) => ({
                    anonymousExportCount: state.anonymousExportCount + 1
                }));
            },

            getRemainingExports: () => {
                const remaining = FREE_EXPORT_LIMIT - get().anonymousExportCount;
                return Math.max(0, remaining);
            },

            resetExportCount: () => {
                set({ anonymousExportCount: 0 });
            },
        }),
        {
            name: 'export-limit-store',
        }
    )
);

export { FREE_EXPORT_LIMIT };
