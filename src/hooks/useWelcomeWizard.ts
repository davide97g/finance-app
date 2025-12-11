import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "gonuts_welcome_wizard_completed";

export interface WelcomeWizardState {
    isCompleted: boolean;
    completedAt: string | null;
    skipped: boolean;
}

export function useWelcomeWizard() {
    const [state, setState] = useState<WelcomeWizardState>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch {
            // Ignore parsing errors
        }
        return { isCompleted: false, completedAt: null, skipped: false };
    });

    const [shouldShow, setShouldShow] = useState(false);

    // Check if wizard should be shown on mount
    useEffect(() => {
        setShouldShow(!state.isCompleted);
    }, [state.isCompleted]);

    // Persist state to localStorage
    const persistState = useCallback((newState: WelcomeWizardState) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        } catch {
            // Ignore storage errors
        }
    }, []);

    // Mark wizard as completed
    const complete = useCallback(() => {
        const newState: WelcomeWizardState = {
            isCompleted: true,
            completedAt: new Date().toISOString(),
            skipped: false,
        };
        setState(newState);
        persistState(newState);
        setShouldShow(false);
    }, [persistState]);

    // Mark wizard as skipped
    const skip = useCallback(() => {
        const newState: WelcomeWizardState = {
            isCompleted: true,
            completedAt: new Date().toISOString(),
            skipped: true,
        };
        setState(newState);
        persistState(newState);
        setShouldShow(false);
    }, [persistState]);

    // Reset wizard (for Settings - re-show tutorial)
    const reset = useCallback(() => {
        const newState: WelcomeWizardState = {
            isCompleted: false,
            completedAt: null,
            skipped: false,
        };
        setState(newState);
        persistState(newState);
        setShouldShow(true);
    }, [persistState]);

    // Manually trigger showing the wizard
    const show = useCallback(() => {
        setShouldShow(true);
    }, []);

    // Close wizard without marking as completed (for external close)
    const close = useCallback(() => {
        setShouldShow(false);
    }, []);

    return {
        shouldShow,
        isCompleted: state.isCompleted,
        wasSkipped: state.skipped,
        completedAt: state.completedAt,
        complete,
        skip,
        reset,
        show,
        close,
    };
}
