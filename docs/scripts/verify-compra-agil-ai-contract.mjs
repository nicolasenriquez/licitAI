import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath) => readFile(resolve(root, relativePath), 'utf8');
const contractPath = 'business/compra-agil-ai-contract.md';
const contract = await read(contractPath);
const sourceContract = await read('business/mercado-publico-source-contract.md');
const docsIndex = await read('index.md');
const docsReadme = await read('README.md');
const aiDelivery = await read('governance/ai-assisted-delivery.md');

const requiredLabels = [
  'official',
  'repository-implemented',
  'repository-policy',
  'unknown',
];

for (const label of requiredLabels) {
  if (!contract.includes(`**${label}**`)) {
    throw new Error(`${contractPath} must define the ${label} evidence label`);
  }
}

for (const url of [
  'https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf',
  'https://www.chilecompra.cl/api/',
]) {
  if (!contract.includes(url)) {
    throw new Error(`${contractPath} is missing required official reference: ${url}`);
  }
}

for (const [name, document] of [
  ['docs index', docsIndex],
  ['docs README', docsReadme],
  ['source contract', sourceContract],
  ['AI delivery guide', aiDelivery],
]) {
  if (!document.includes('compra-agil-ai-contract.md')) {
    throw new Error(`${name} must link to ${contractPath}`);
  }
}

for (const relativePath of [
  contractPath,
  'business/mercado-publico-source-contract.md',
  'governance/ai-assisted-delivery.md',
  'operations/mercado-publico-ingestion.md',
]) {
  await access(resolve(root, relativePath));
}

for (const forbiddenClaim of [
  'shared across all Mercado Publico API sources',
  '24-hour anchored to `America/Santiago` local time',
  'minimum 10, maximum 50',
]) {
  if (sourceContract.includes(forbiddenClaim)) {
    throw new Error(`Source contract still presents a superseded claim: ${forbiddenClaim}`);
  }
}

console.log('Compra Agil AI contract documentation checks passed.');
