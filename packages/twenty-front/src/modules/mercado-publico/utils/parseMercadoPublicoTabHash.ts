export const MERCADO_PUBLICO_TAB_IDS = [
  'compra-agil',
  'licitaciones',
  'centro-de-control',
] as const;

export type MercadoPublicoTabId = (typeof MERCADO_PUBLICO_TAB_IDS)[number];

export const parseMercadoPublicoTabHash = (
  hash: string | undefined,
): MercadoPublicoTabId => {
  const tabId = hash?.replace(/^#/, '').trim();

  return MERCADO_PUBLICO_TAB_IDS.includes(tabId as MercadoPublicoTabId)
    ? (tabId as MercadoPublicoTabId)
    : 'compra-agil';
};
