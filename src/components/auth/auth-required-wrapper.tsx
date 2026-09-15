"use client";

import { useState } from "react";
import { useAuthStore } from "../../store/use-auth-store";
import { ExportLoginPrompt } from "./export-login-prompt";

interface AuthRequiredWrapperProps {
    children: React.ReactNode;
    featureName?: string;
    onClick?: () => void;
    className?: string;
}

/**
 * Wrapper component that shows login prompt for anonymous users
 * when they try to use premium features
 */
export function AuthRequiredWrapper({
    children,
    featureName = "this feature",
    onClick,
    className,
}: AuthRequiredWrapperProps) {
    const { isAuthenticated } = useAuthStore();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (!isAuthenticated) {
            e.preventDefault();
            e.stopPropagation();
            setShowLoginPrompt(true);
            return;
        }
        onClick?.();
    };

    return (
        <>
            <div onClick={handleClick} className={className}>
                {children}
            </div>
            <ExportLoginPrompt
                open={showLoginPrompt}
                onOpenChange={setShowLoginPrompt}
                remainingExports={0}
            />
        </>
    );
}

/**
 * Hook to check auth and show login prompt
 */
export function useAuthRequired() {
    const { isAuthenticated } = useAuthStore();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const requireAuth = (callback?: () => void) => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return false;
        }
        callback?.();
        return true;
    };

    return {
        isAuthenticated,
        showLoginPrompt,
        setShowLoginPrompt,
        requireAuth,
    };
}
