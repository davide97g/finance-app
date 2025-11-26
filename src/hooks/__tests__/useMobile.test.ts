import { renderHook, act } from '@testing-library/react';
import { useMobile } from '../useMobile';

describe('useMobile', () => {
    let originalInnerWidth: number;

    beforeEach(() => {
        originalInnerWidth = window.innerWidth;
    });

    afterEach(() => {
        // Restore original window width
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalInnerWidth,
        });
    });

    it('should return true for mobile viewport (< 768px)', () => {
        // Set window width to mobile size
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        });

        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(true);
    });

    it('should return false for desktop viewport (>= 768px)', () => {
        // Set window width to desktop size
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        });

        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(false);
    });

    it('should update when window is resized', () => {
        // Start with desktop size
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        });

        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(false);

        // Resize to mobile
        act(() => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500,
            });
            window.dispatchEvent(new Event('resize'));
        });

        expect(result.current).toBe(true);
    });

    it('should handle exact breakpoint (768px)', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 768,
        });

        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(false); // >= 768 is desktop
    });

    it('should handle 767px as mobile', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 767,
        });

        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(true); // < 768 is mobile
    });
});
