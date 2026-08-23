import detailEnvelope from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-detail-production-envelope.json';
import listEnvelope from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-list.json';
import {
  decodeV2CompraAgilDetailPayload,
  decodeV2CompraAgilListPayload,
  extractV2CompraAgilListRecords,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';

describe('Compra Agil V2 payload decoders', () => {
  it('decodes LIST only from payload.items', () => {
    expect(extractV2CompraAgilListRecords(listEnvelope)).toEqual([
      expect.objectContaining({ codigo: 'FIXTURE-CA-001' }),
    ]);
    expect(
      extractV2CompraAgilListRecords({
        Items: [{ codigo: 'CA-WRONG-ENVELOPE' }],
      }),
    ).toEqual([]);
  });

  it('rejects the complete LIST when one item is invalid', () => {
    const decoded = decodeV2CompraAgilListPayload({
      payload: {
        items: [{ codigo: 'CA-1' }, { not_a_record: true }, { codigo: 'CA-3' }],
      },
    });

    expect(decoded).toEqual({
      records: [],
      recordsFetched: 3,
      recordsAccepted: 0,
      recordsRejected: 3,
      contractIssues: [
        {
          code: 'invalid_field',
          indices: [1],
          paths: ['[1].codigo'],
        },
      ],
      errorCode: 'invalid_list_items',
      errorMessage:
        'Compra Agil V2 LIST contract invalid: itemCount=3; invalidItemCount=1; invalidIndices=[1]; invalidPaths=[[1].codigo]',
    });
  });

  it('rejects the complete LIST when codigo repeats within one page', () => {
    const decoded = decodeV2CompraAgilListPayload({
      payload: {
        items: [{ codigo: 'CA-1' }, { codigo: 'CA-1' }, { codigo: 'CA-3' }],
      },
    });

    expect(decoded).toMatchObject({
      records: [],
      recordsFetched: 3,
      recordsAccepted: 0,
      recordsRejected: 3,
      contractIssues: [{ code: 'duplicate_codigo', indices: [0, 1] }],
      errorCode: 'invalid_list_items',
    });
  });

  it('reports unknown counts when the LIST envelope is invalid', () => {
    expect(decodeV2CompraAgilListPayload({ payload: {} })).toMatchObject({
      records: [],
      recordsFetched: null,
      recordsAccepted: null,
      recordsRejected: null,
      contractIssues: [],
      errorCode: 'invalid_list_envelope',
    });
  });

  it.each([
    ['object field', { codigo: 'CA-1', fechas: [] }, '[0].fechas'],
    [
      'array field',
      { codigo: 'CA-1', proveedores_cotizando: {} },
      '[0].proveedores_cotizando',
    ],
    [
      'array item',
      { codigo: 'CA-1', documentos: ['invalid'] },
      '[0].documentos[0]',
    ],
    [
      'nested array field',
      {
        codigo: 'CA-1',
        proveedores_cotizando: [{ productos_cotizados: {} }],
      },
      '[0].proveedores_cotizando[0].productos_cotizados',
    ],
  ])('rejects malformed nested %s', (_label, item, path) => {
    const decoded = decodeV2CompraAgilListPayload({
      payload: { items: [item] },
    });

    expect(decoded).toMatchObject({
      records: [],
      errorCode: 'invalid_list_items',
      errorMessage: expect.stringContaining(path),
    });
  });

  it('decodes DETAIL only from payload', () => {
    expect(decodeV2CompraAgilDetailPayload(detailEnvelope).records).toEqual([
      expect.objectContaining({ codigo: 'FIXTURE-CA-DETAIL' }),
    ]);
    expect(decodeV2CompraAgilDetailPayload(detailEnvelope)).toMatchObject({
      recordsFetched: 1,
      recordsAccepted: 1,
      recordsRejected: 0,
      contractIssues: [],
    });
    expect(
      decodeV2CompraAgilDetailPayload({
        data: { codigo: 'CA-WRONG-ENVELOPE' },
      }),
    ).toMatchObject({ records: [], errorCode: 'invalid_detail_envelope' });
  });

  it('accounts for an invalid DETAIL record', () => {
    expect(
      decodeV2CompraAgilDetailPayload({ payload: { codigo: '' } }),
    ).toMatchObject({
      records: [],
      recordsFetched: 1,
      recordsAccepted: 0,
      recordsRejected: 1,
      contractIssues: [
        { code: 'invalid_field', indices: [0], paths: ['payload.codigo'] },
      ],
      errorCode: 'invalid_detail_envelope',
    });
  });
});
