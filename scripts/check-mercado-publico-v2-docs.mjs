import { readFile } from 'node:fs/promises';

const documentPath = new URL(
  '../docs/operations/mercado-publico-compra-agil-v2.md',
  import.meta.url,
);
const documentText = await readFile(documentPath, 'utf8');
const requiredClaims = [
  'Evidence Labels',
  '`ticket` header',
  '`orden` is rejected',
  'tamano_pagina` is at most 50',
  'Retry-After',
];
const officialLinks = [...documentText.matchAll(/\((https:\/\/[^)]+)\)/g)].map(
  (match) => match[1],
);

for (const claim of requiredClaims) {
  if (!documentText.includes(claim)) {
    throw new Error(`Missing Compra Agil V2 documentation claim: ${claim}`);
  }
}

if (officialLinks.length < 2 || officialLinks.some((link) => !link.includes('mercadopublico.cl'))) {
  throw new Error('Compra Agil V2 documentation must retain two official Mercado Publico links');
}

console.log('Compra Agil V2 documentation checks passed.');
