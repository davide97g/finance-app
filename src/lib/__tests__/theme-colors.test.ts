import { applyThemeColor, THEME_COLORS } from '../theme-colors';

describe('theme-colors', () => {
    let root: HTMLElement;

    beforeEach(() => {
        root = document.documentElement;
        // Clear any existing styles
        root.style.cssText = '';
    });

    describe('THEME_COLORS', () => {
        it('should have correct structure', () => {
            expect(typeof THEME_COLORS).toBe('object');

            Object.values(THEME_COLORS).forEach(theme => {
                expect(theme).toHaveProperty('name');
                expect(theme).toHaveProperty('label');
                expect(theme).toHaveProperty('light');
                expect(theme).toHaveProperty('dark');

                expect(theme.light).toHaveProperty('primary');
                expect(theme.light).toHaveProperty('primaryForeground');
                expect(theme.light).toHaveProperty('ring');

                expect(theme.dark).toHaveProperty('primary');
                expect(theme.dark).toHaveProperty('primaryForeground');
                expect(theme.dark).toHaveProperty('ring');
            });
        });

        it('should contain expected color themes', () => {
            expect(THEME_COLORS).toHaveProperty('slate');
            expect(THEME_COLORS).toHaveProperty('blue');
            expect(THEME_COLORS).toHaveProperty('violet');
            expect(THEME_COLORS).toHaveProperty('green');
            expect(THEME_COLORS).toHaveProperty('orange');
            expect(THEME_COLORS).toHaveProperty('rose');
            expect(THEME_COLORS).toHaveProperty('zinc');
        });
    });

    describe('applyThemeColor', () => {
        it('should apply light theme colors', () => {
            applyThemeColor('blue', false);

            const primary = root.style.getPropertyValue('--primary');
            const primaryForeground = root.style.getPropertyValue('--primary-foreground');
            const ring = root.style.getPropertyValue('--ring');

            expect(primary).toBe(THEME_COLORS.blue.light.primary);
            expect(primaryForeground).toBe(THEME_COLORS.blue.light.primaryForeground);
            expect(ring).toBe(THEME_COLORS.blue.light.ring);
        });

        it('should apply dark theme colors', () => {
            applyThemeColor('blue', true);

            const primary = root.style.getPropertyValue('--primary');
            const primaryForeground = root.style.getPropertyValue('--primary-foreground');
            const ring = root.style.getPropertyValue('--ring');

            expect(primary).toBe(THEME_COLORS.blue.dark.primary);
            expect(primaryForeground).toBe(THEME_COLORS.blue.dark.primaryForeground);
            expect(ring).toBe(THEME_COLORS.blue.dark.ring);
        });

        it('should handle all available colors', () => {
            Object.keys(THEME_COLORS).forEach(colorName => {
                applyThemeColor(colorName, false);
                expect(root.style.getPropertyValue('--primary')).toBeTruthy();

                applyThemeColor(colorName, true);
                expect(root.style.getPropertyValue('--primary')).toBeTruthy();
            });
        });

        it('should handle invalid color gracefully', () => {
            expect(() => applyThemeColor('invalid', false)).not.toThrow();
            // Should not set any properties
            expect(root.style.getPropertyValue('--primary')).toBe('');
        });

        it('should switch between light and dark', () => {
            applyThemeColor('violet', false);
            const lightPrimary = root.style.getPropertyValue('--primary');

            applyThemeColor('violet', true);
            const darkPrimary = root.style.getPropertyValue('--primary');

            expect(lightPrimary).not.toBe(darkPrimary);
        });
    });
});
