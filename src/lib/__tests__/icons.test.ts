import { getIconComponent, AVAILABLE_ICONS } from '../icons';
import { Home, ShoppingCart, Car } from 'lucide-react';

describe('icons', () => {
    describe('AVAILABLE_ICONS', () => {
        it('should have correct structure', () => {
            expect(AVAILABLE_ICONS).toBeInstanceOf(Array);
            expect(AVAILABLE_ICONS.length).toBeGreaterThan(0);

            AVAILABLE_ICONS.forEach(icon => {
                expect(icon).toHaveProperty('name');
                expect(icon).toHaveProperty('icon');
                expect(typeof icon.name).toBe('string');
                expect(typeof icon.icon).toBe('object'); // Lucide icons are objects/components
            });
        });

        it('should contain expected icons', () => {
            const iconNames = AVAILABLE_ICONS.map(i => i.name);
            expect(iconNames).toContain('Home');
            expect(iconNames).toContain('ShoppingCart');
            expect(iconNames).toContain('Car');
        });

        it('should have unique icon names', () => {
            const names = AVAILABLE_ICONS.map(i => i.name);
            const uniqueNames = new Set(names);
            expect(names.length).toBe(uniqueNames.size);
        });
    });

    describe('getIconComponent', () => {
        it('should return correct icon component for valid name', () => {
            const HomeIcon = getIconComponent('Home');
            expect(HomeIcon).toBe(Home);
        });

        it('should return null for invalid icon name', () => {
            const result = getIconComponent('NonExistentIcon');
            expect(result).toBeNull();
        });

        it('should return null for empty string', () => {
            const result = getIconComponent('');
            expect(result).toBeNull();
        });

        it('should be case-sensitive', () => {
            const result = getIconComponent('home'); // lowercase
            expect(result).toBeNull();
        });

        it('should work for all available icons', () => {
            AVAILABLE_ICONS.forEach(({ name, icon }) => {
                const result = getIconComponent(name);
                expect(result).toBe(icon);
            });
        });
    });
});
