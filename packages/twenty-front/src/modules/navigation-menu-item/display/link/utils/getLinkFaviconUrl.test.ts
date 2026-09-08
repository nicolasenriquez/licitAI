import { getLinkFaviconUrl } from '@/navigation-menu-item/display/link/utils/getLinkFaviconUrl';

describe('getLinkFaviconUrl', () => {
  it('does not turn a relative application link into an external favicon request', () => {
    expect(getLinkFaviconUrl('mercado-publico')).toBeUndefined();
  });

  it('keeps favicon support for explicit web URLs', () => {
    expect(getLinkFaviconUrl('https://example.com')).toBe(
      'https://twenty-icons.com/example.com',
    );
  });
});
