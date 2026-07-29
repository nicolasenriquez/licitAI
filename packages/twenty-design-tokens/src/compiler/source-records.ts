import primitives from '../source/primitives.json';
import marketingCommon from '../source/marketing/common.json';
import marketingDark from '../source/marketing/dark.json';
import marketingLight from '../source/marketing/light.json';
import marketingMuted from '../source/marketing/muted.json';
import productCommon from '../source/product/common.json';
import productDark from '../source/product/dark.json';
import productLight from '../source/product/light.json';
import { type TokenRecords } from './types';

export const tokenRecords: TokenRecords = {
  primitives,
  product: {
    common: productCommon,
    dark: productDark,
    light: productLight,
  },
  marketing: {
    common: marketingCommon,
    dark: marketingDark,
    light: marketingLight,
    muted: marketingMuted,
  },
};
