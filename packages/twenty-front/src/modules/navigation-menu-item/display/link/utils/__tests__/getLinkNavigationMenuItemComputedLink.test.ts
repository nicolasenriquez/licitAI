import { getLinkNavigationMenuItemComputedLink } from '@/navigation-menu-item/display/link/utils/getLinkNavigationMenuItemComputedLink';

describe('getLinkNavigationMenuItemComputedLink', () => {
  it('returns external links unchanged', () => {
    expect(
      getLinkNavigationMenuItemComputedLink({ link: 'https://example.com' }),
    ).toBe('https://example.com');
    expect(
      getLinkNavigationMenuItemComputedLink({ link: 'http://example.com' }),
    ).toBe('http://example.com');
  });

  it('returns relative internal links unchanged', () => {
    expect(
      getLinkNavigationMenuItemComputedLink({ link: '/mercado-publico' }),
    ).toBe('/mercado-publico');
  });

  it('prefixes bare domains with https', () => {
    expect(getLinkNavigationMenuItemComputedLink({ link: 'example.com' })).toBe(
      'https://example.com',
    );
  });

  it('returns empty string for missing links', () => {
    expect(getLinkNavigationMenuItemComputedLink({ link: null })).toBe('');
    expect(getLinkNavigationMenuItemComputedLink({ link: '' })).toBe('');
  });
});
