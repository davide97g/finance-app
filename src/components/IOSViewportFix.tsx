import { useEffect } from "react";

export function IOSViewportFix() {
    useEffect(() => {
        function setAppHeight() {
            const doc = document.documentElement;
            doc.style.setProperty("--app-height", `${window.innerHeight}px`);
        }

        window.addEventListener("resize", setAppHeight);
        window.addEventListener("orientationchange", setAppHeight);

        // Initial set
        setAppHeight();

        return () => {
            window.removeEventListener("resize", setAppHeight);
            window.removeEventListener("orientationchange", setAppHeight);
        };
    }, []);

    return null;
}
