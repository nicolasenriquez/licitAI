import { getLinkNavigationMenuItemComputedLink } from '@/navigation-menu-item/display/link/utils/getLinkNavigationMenuItemComputedLink';

describe('getLinkNavigationMenuItemComputedLink', () => {
  it('preserves internal links and their hash', () => {
    expect(
      getLinkNavigationMenuItemComputedLink({
        link: '/mercado-publico#compra-agil',
      }),
    ).toBe('/mercado-publico#compra-agil');
  });

  it('adds https to external links without a protocol', () => {
    expect(
      getLinkNavigationMenuItemComputedLink({ link: 'example.com/path' }),
    ).toBe('https://example.com/path');
  });
});
