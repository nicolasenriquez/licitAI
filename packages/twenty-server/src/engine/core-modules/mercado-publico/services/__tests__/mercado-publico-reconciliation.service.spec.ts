import { type DataSource, type EntityManager } from 'typeorm';

import { MercadoPublicoReconciliationService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-reconciliation.service';

describe('MercadoPublicoReconciliationService', () => {
  const mockEntityManager = {
    query: jest.fn(),
  } as unknown as jest.Mocked<EntityManager>;

  const mockCoreDataSource = {
    transaction: jest.fn(
      async (callback: (entityManager: EntityManager) => unknown) =>
        callback(mockEntityManager),
    ),
  } as unknown as jest.Mocked<DataSource>;

  const service = new MercadoPublicoReconciliationService(mockCoreDataSource);

  beforeEach(() => {
    jest.clearAllMocks();
    (mockEntityManager.query as jest.Mock).mockReset();
    (mockEntityManager.query as jest.Mock).mockResolvedValue([]);
  });

  function mockSelectExactCodigoExterno(keys: string[]) {
    mockEntityManager.query.mockResolvedValueOnce(
      keys.map((k) => ({ codigo_externo: k })),
    );
  }

  function mockInsert(resultCount: number) {
    mockEntityManager.query.mockResolvedValueOnce(
      Array.from({ length: resultCount }, () => ({ upserted: 1 })),
    );
  }

  function mockInsertUnmatchedRows(
    rows: { entity_a_key: string; entity_a_type: string }[],
  ) {
    mockEntityManager.query.mockResolvedValueOnce(rows);
  }

  function mockSelectCsvApiSameBusinessKey(codigos: string[]) {
    mockEntityManager.query.mockResolvedValueOnce(
      codigos.map((k) => ({ codigo: k })),
    );
  }

  function mockSelectExactCodigoLicitacion(
    pairs: { codigo_externo: string; codigo_oc: string }[],
  ) {
    mockEntityManager.query.mockResolvedValueOnce(
      pairs.map((p) => ({
        codigo_externo: p.codigo_externo,
        codigo_oc: p.codigo_oc,
      })),
    );
  }

  function mockSelectCompraAgil(
    rows: {
      codigo: string;
      id_orden_compra: string | null;
      id_oc: string | null;
    }[],
  ) {
    mockEntityManager.query.mockResolvedValueOnce(rows);
  }

  function mockOcBulkLookup(codigos: string[]) {
    mockEntityManager.query.mockResolvedValueOnce(
      codigos.map((c) => ({ codigo: c })),
    );
  }

  function mockSelectEmpty() {
    mockEntityManager.query.mockResolvedValueOnce([]);
  }

  function mockSelectCandidateSupplier(
    rows: { api_codigo: string; csv_codigo: string }[],
  ) {
    mockEntityManager.query.mockResolvedValueOnce(rows);
  }

  function mockSelectCandidateItem(
    rows: { codigo_externo: string; codigoitem: string }[],
  ) {
    mockEntityManager.query.mockResolvedValueOnce(rows);
  }

  function mockSelectUnmatched(
    rows: { entity_key: string; entity_type: string }[],
  ) {
    mockEntityManager.query.mockResolvedValueOnce(rows);
  }

  function mockSelectStateMismatch(
    rows: {
      codigo_externo: string;
      canonical_state: string;
      latest_staging_estado: string;
    }[],
  ) {
    mockEntityManager.query.mockResolvedValueOnce(rows);
  }

  function mockSelectSourcePeriodRerun(
    rows: {
      source_dataset: string;
      source_period: string;
      checksum_older: string;
      checksum_newer: string;
    }[],
  ) {
    mockEntityManager.query.mockResolvedValueOnce(rows);
  }

  function mockMaterializeGoldRows(processTypes: string[]) {
    mockEntityManager.query.mockResolvedValueOnce(
      processTypes.map((process_type) => ({ process_type })),
    );
  }

  it('writes exact_codigo_externo matches on intersecting keys', async () => {
    mockSelectExactCodigoExterno(['L1', 'L2']);
    mockInsert(2);
    mockSelectCsvApiSameBusinessKey([]);
    mockSelectExactCodigoLicitacion([]);
    mockSelectCompraAgil([]);

    const result = await service.refreshAllExactReconciliation();

    expect(result.exactCodigoExterno).toBe(2);
    expect(result.csvApiSameBusinessKey).toBe(0);
    expect(result.exactCodigoLicitacion).toBe(0);
    expect(result.exactCompraAgilIdOrdenCompra).toBe(0);
    expect(result.total).toBe(2);

    expect(mockEntityManager.query).toHaveBeenCalledTimes(5);
  });

  it('writes csv_api_same_business_key for OC staging intersection', async () => {
    mockSelectExactCodigoExterno([]);
    mockSelectCsvApiSameBusinessKey(['OC1', 'OC2']);
    mockInsert(2);
    mockSelectExactCodigoLicitacion([]);
    mockSelectCompraAgil([]);

    const result = await service.refreshAllExactReconciliation();

    expect(result.csvApiSameBusinessKey).toBe(2);
    expect(result.exactCodigoExterno).toBe(0);

    expect(mockEntityManager.query).toHaveBeenCalledTimes(5);
  });

  it('writes exact_codigo_licitacion from canonical join', async () => {
    mockSelectExactCodigoExterno([]);
    mockSelectCsvApiSameBusinessKey([]);
    mockSelectExactCodigoLicitacion([
      { codigo_externo: 'L1', codigo_oc: 'OC1' },
    ]);
    mockInsert(1);
    mockSelectCompraAgil([]);

    const result = await service.refreshAllExactReconciliation();

    expect(result.exactCodigoLicitacion).toBe(1);
    expect(result.total).toBe(1);

    expect(mockEntityManager.query).toHaveBeenCalledTimes(5);
  });

  it('deduplicates licitacion-to-OC pairs with same keys', async () => {
    mockSelectExactCodigoExterno([]);
    mockSelectCsvApiSameBusinessKey([]);
    mockSelectExactCodigoLicitacion([
      { codigo_externo: 'L1', codigo_oc: 'OC1' },
      { codigo_externo: 'L1', codigo_oc: 'OC1' },
    ]);
    mockInsert(1);
    mockSelectCompraAgil([]);

    const result = await service.refreshAllExactReconciliation();

    expect(result.exactCodigoLicitacion).toBe(1);
  });

  it('writes exact_compra_agil_id_orden_compra preferring id_orden_compra', async () => {
    mockSelectExactCodigoExterno([]);
    mockSelectCsvApiSameBusinessKey([]);
    mockSelectExactCodigoLicitacion([]);
    mockSelectCompraAgil([
      { codigo: 'CA1', id_orden_compra: 'OC1', id_oc: 'OC2' },
    ]);
    mockOcBulkLookup(['OC1']);
    mockInsert(1);

    const result = await service.refreshAllExactReconciliation();

    expect(result.exactCompraAgilIdOrdenCompra).toBe(1);
    expect(result.total).toBe(1);

    expect(mockEntityManager.query).toHaveBeenCalledTimes(6);
  });

  it('returns zeros when all canonical and staging tables are empty', async () => {
    mockSelectExactCodigoExterno([]);
    mockSelectCsvApiSameBusinessKey([]);
    mockSelectExactCodigoLicitacion([]);
    mockSelectCompraAgil([]);

    const result = await service.refreshAllExactReconciliation();

    expect(result).toEqual({
      exactCodigoExterno: 0,
      csvApiSameBusinessKey: 0,
      exactCodigoLicitacion: 0,
      exactCompraAgilIdOrdenCompra: 0,
      total: 0,
    });
  });

  it('is idempotent on rerun (UK prevents duplicates)', async () => {
    mockSelectExactCodigoExterno(['L1']);
    mockInsert(1);
    mockSelectCsvApiSameBusinessKey([]);
    mockSelectExactCodigoLicitacion([]);
    mockSelectCompraAgil([]);

    const result1 = await service.refreshAllExactReconciliation();
    expect(result1.exactCodigoExterno).toBe(1);

    mockSelectExactCodigoExterno(['L1']);
    mockInsert(1);
    mockSelectCsvApiSameBusinessKey([]);
    mockSelectExactCodigoLicitacion([]);
    mockSelectCompraAgil([]);

    const result2 = await service.refreshAllExactReconciliation();
    expect(result2.exactCodigoExterno).toBe(1);
  });

  describe('refreshAllHeuristicReconciliation', () => {
    it('returns zeros when all canonical and staging tables are empty', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      const result = await service.refreshAllHeuristicReconciliation();

      expect(result).toEqual({
        candidates: 0,
        unmatched: 0,
        events: 0,
        goldProcessesMaterialized: 0,
        total: 0,
      });
      expect(mockEntityManager.query).toHaveBeenCalledTimes(6);
      expect(mockCoreDataSource.transaction).toHaveBeenCalledTimes(6);
    });

    it('records candidate_supplier_amount when same provider, no exact key', async () => {
      mockSelectCandidateSupplier([
        { api_codigo: 'OC1', csv_codigo: 'CSV-OC1' },
      ]);
      mockInsert(1);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      const result = await service.refreshAllHeuristicReconciliation();

      expect(result.candidates).toBe(1);
      expect(result.unmatched).toBe(0);
      expect(result.events).toBe(0);
      expect(result.total).toBe(1);
    });

    it('binds the supplier tolerance parameter with the first placeholder', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      await service.refreshAllHeuristicReconciliation();

      const supplierCall = (mockEntityManager.query as jest.Mock).mock.calls[0];
      const supplierSql = supplierCall?.[0] as string;
      const supplierParams = supplierCall?.[1] as unknown[] | undefined;

      expect(supplierSql).toContain('<= $1');
      expect(supplierSql).not.toContain('<= $3');
      expect(supplierParams).toHaveLength(2);
    });

    it('records candidate_item_amount when canonical item has monto, no exact key', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([{ codigo_externo: 'L1', codigoitem: 'I1' }]);
      mockInsert(1);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      const result = await service.refreshAllHeuristicReconciliation();

      expect(result.candidates).toBe(1);
      expect(result.unmatched).toBe(0);
      expect(result.events).toBe(0);
      expect(result.total).toBe(1);
    });

    it('binds the item tolerance parameter with the first placeholder', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      await service.refreshAllHeuristicReconciliation();

      const itemCall = (mockEntityManager.query as jest.Mock).mock.calls[1];
      const itemSql = itemCall?.[0] as string;
      const itemParams = itemCall?.[1] as unknown[] | undefined;

      expect(itemSql).toContain('<= $1');
      expect(itemSql).not.toContain('<= $2');
      expect(itemParams).toHaveLength(1);
    });

    it('records unmatched for canonical rows with zero reconciliation links', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([{ entity_key: 'L1', entity_type: 'licitacion' }]);
      mockInsert(1);
      mockInsertUnmatchedRows([
        { entity_a_key: 'L1', entity_a_type: 'licitacion' },
      ]);
      mockSelectEmpty();
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      const result = await service.refreshAllHeuristicReconciliation();

      expect(result.unmatched).toBe(1);
      expect(result.goldProcessesMaterialized).toBe(0);
      expect(result.candidates).toBe(0);
      expect(result.events).toBe(0);
      expect(result.total).toBe(1);
    });

    it('does not let item-level hints suppress unmatched licitaciones', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      await service.refreshAllHeuristicReconciliation();

      const unmatchedCall = (mockEntityManager.query as jest.Mock).mock
        .calls[2];
      const unmatchedSql = unmatchedCall?.[0] as string;

      expect(unmatchedSql).toContain("r.entity_b_type = 'licitacion'");
      expect(unmatchedSql).toContain("AND r.entity_a_type = 'licitacion'");
    });

    it('does not let candidate_supplier suppress unmatched ordenes_compra', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      await service.refreshAllHeuristicReconciliation();

      const unmatchedCall = (mockEntityManager.query as jest.Mock).mock
        .calls[2];
      const unmatchedSql = unmatchedCall?.[0] as string;

      expect(unmatchedSql).toContain('AND r.match_type = ANY($1::text[])');
    });

    it('includes Compra Agil in unmatched reconciliation with its API V2 source', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([{ entity_key: 'CA1', entity_type: 'compra_agil' }]);
      mockSelectEmpty();
      mockInsertUnmatchedRows([
        { entity_a_key: 'CA1', entity_a_type: 'compra_agil' },
      ]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      await service.refreshAllHeuristicReconciliation();

      const unmatchedInsertCall = (mockEntityManager.query as jest.Mock).mock
        .calls[4];
      const unmatchedInsertParams = unmatchedInsertCall?.[1] as unknown[];

      expect(unmatchedInsertParams[0]).toBe('api-v2-compra-agil');
      const unmatchedSelectSql = (mockEntityManager.query as jest.Mock).mock
        .calls[2]?.[0] as string;
      expect(unmatchedSelectSql).toContain("'compra_agil' AS entity_type");
      expect(unmatchedSelectSql).toContain('FROM mp.compra_agil');
    });

    it('records state_mismatch event when canonical state differs from latest staging', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([
        {
          codigo_externo: 'L1',
          canonical_state: 'Publicada',
          latest_staging_estado: 'Cerrada',
        },
      ]);
      mockInsert(1);
      mockSelectSourcePeriodRerun([]);

      const result = await service.refreshAllHeuristicReconciliation();

      expect(result.events).toBe(1);
      expect(result.candidates).toBe(0);
      expect(result.unmatched).toBe(0);
      expect(result.total).toBe(1);
    });

    it('records source_period_rerun_mismatch when re-downloaded CSV has different checksum', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([
        {
          source_dataset: 'oc',
          source_period: '2026-06',
          checksum_older: 'abc123',
          checksum_newer: 'def456',
        },
      ]);
      mockInsert(1);

      const result = await service.refreshAllHeuristicReconciliation();

      expect(result.events).toBe(1);
      expect(result.candidates).toBe(0);
      expect(result.unmatched).toBe(0);
      expect(result.total).toBe(1);
    });

    it('targets newest and second-newest file checksums for source-period reruns', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([
        {
          source_dataset: 'licitaciones',
          source_period: '2026-06',
          checksum_older: 'second-newest',
          checksum_newer: 'newest',
        },
      ]);
      mockInsert(1);

      await service.refreshAllHeuristicReconciliation();

      const rerunCall = (mockEntityManager.query as jest.Mock).mock.calls[4];
      const rerunSql = rerunCall?.[0] as string;
      const insertCall = (mockEntityManager.query as jest.Mock).mock.calls[5];
      const insertParams = insertCall?.[1] as unknown[];

      expect(rerunSql).toContain('INNER JOIN LATERAL');
      expect(rerunSql).toContain('ORDER BY downloaded_at DESC, id DESC');
      expect(rerunSql).toContain('AND id <> newer.id');
      expect(insertParams[6]).toBe(
        JSON.stringify({
          sourceDataset: 'licitaciones',
          sourcePeriod: '2026-06',
          checksumOlder: 'second-newest',
          checksumNewer: 'newest',
        }),
      );
    });

    it('is idempotent on event rerun (fingerprint UK prevents duplicates)', async () => {
      const stateMismatchRow = {
        codigo_externo: 'L1',
        canonical_state: 'Publicada',
        latest_staging_estado: 'Cerrada',
      };

      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([stateMismatchRow]);
      mockInsert(1);
      mockSelectSourcePeriodRerun([]);

      const result1 = await service.refreshAllHeuristicReconciliation();
      expect(result1.events).toBe(1);

      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([stateMismatchRow]);
      mockInsert(1);
      mockSelectSourcePeriodRerun([]);

      const result2 = await service.refreshAllHeuristicReconciliation();
      expect(result2.events).toBe(1);
    });

    it('reconcileStateMismatchEvents SQL contains DISTINCT ON with matching ORDER BY', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      await service.refreshAllHeuristicReconciliation();

      const calls = (mockEntityManager.query as jest.Mock).mock.calls;
      const stateMismatchSql = calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' &&
          (c[0] as string).includes('exact_codigo_externo') &&
          (c[0] as string).includes('canonical_state'),
      )?.[0] as string | undefined;

      expect(stateMismatchSql).toBeDefined();
      expect(stateMismatchSql).toContain('DISTINCT ON (r.entity_a_key)');
      expect(stateMismatchSql).toContain('ORDER BY r.entity_a_key');
    });

    it('reconcileCandidateItem does not attribute across licitaciones', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      const result = await service.refreshAllHeuristicReconciliation();

      expect(result.candidates).toBe(0);
    });

    it('returns zero unmatched and gold materializations when unmatched upsert conflicts on rerun', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([{ entity_key: 'L1', entity_type: 'licitacion' }]);
      mockInsert(1);
      mockInsertUnmatchedRows([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);
      mockMaterializeGoldRows([]);

      const result = await service.refreshAllHeuristicReconciliation();

      expect(result.unmatched).toBe(0);
      expect(result.goldProcessesMaterialized).toBe(0);
    });

    it('suppresses manual-review rerun noise when unmatched already exists', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      await service.refreshAllHeuristicReconciliation();

      const unmatchedCall = (mockEntityManager.query as jest.Mock).mock
        .calls[2];

      const unmatchedParams = unmatchedCall?.[1] as unknown[] | undefined;

      expect(unmatchedParams).toBeDefined();
      expect(unmatchedParams![0]).toEqual(
        expect.arrayContaining(['unmatched']),
      );
    });

    it('uses one transaction per heuristic phase', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      await service.refreshAllHeuristicReconciliation();

      expect(mockCoreDataSource.transaction).toHaveBeenCalledTimes(6);
    });

    it('keeps earlier heuristic phases committed when a later phase fails', async () => {
      const transactionCalls: string[] = [];
      const transactionMock = mockCoreDataSource.transaction as jest.Mock;

      transactionMock.mockImplementationOnce(
        async (callback: (entityManager: EntityManager) => unknown) => {
          transactionCalls.push('candidateSupplier');
          return callback(mockEntityManager);
        },
      );
      transactionMock.mockImplementationOnce(
        async (callback: (entityManager: EntityManager) => unknown) => {
          transactionCalls.push('candidateItem');
          return callback(mockEntityManager);
        },
      );
      transactionMock.mockImplementationOnce(
        async (callback: (entityManager: EntityManager) => unknown) => {
          transactionCalls.push('unmatched');
          return callback(mockEntityManager);
        },
      );
      transactionMock.mockImplementationOnce(async () => {
        transactionCalls.push('stateMismatch');
        throw new Error('phase failed');
      });

      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);

      await expect(service.refreshAllHeuristicReconciliation()).rejects.toThrow(
        'phase failed',
      );
      expect(transactionCalls).toEqual([
        'candidateSupplier',
        'candidateItem',
        'unmatched',
        'stateMismatch',
      ]);
    });

    it('uses bulk existence lookup for Compra Agil OC candidates', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);

      await service.refreshAllHeuristicReconciliation();

      const calls = (mockEntityManager.query as jest.Mock).mock.calls;
      const caBulkLookups = calls.filter(
        (c: unknown[]) =>
          typeof c[0] === 'string' &&
          (c[0] as string).includes('WHERE codigo = ANY'),
      );

      expect(caBulkLookups.length).toBeLessThanOrEqual(1);
    });

    it('materializes all canonical process types with status precedence', async () => {
      mockSelectCandidateSupplier([]);
      mockSelectCandidateItem([]);
      mockSelectUnmatched([]);
      mockSelectStateMismatch([]);
      mockSelectSourcePeriodRerun([]);
      mockMaterializeGoldRows(['licitacion', 'orden_compra', 'compra_agil']);

      const result = await service.refreshAllHeuristicReconciliation();
      const calls = (mockEntityManager.query as jest.Mock).mock.calls;
      const materializationCall = calls[calls.length - 1];
      const materializationSql = materializationCall?.[0] as string;

      expect(result.goldProcessesMaterialized).toBe(3);
      expect(materializationSql).toContain("'compra_agil' AS process_type");
      const compraAgilSql = materializationSql.slice(
        materializationSql.indexOf("'compra_agil' AS process_type"),
      );
      expect(compraAgilSql).toContain('title');
      expect(compraAgilSql).toContain('buyer_name');
      expect(compraAgilSql).toContain('fecha_publicacion AS published_at');
      expect(compraAgilSql).toContain('fecha_cierre AS closing_at');
      expect(materializationSql).toContain('BOOL_OR');
      expect(materializationSql).toContain('GROUP BY entity_type, entity_key');
      expect(materializationSql).toContain('LEFT JOIN status_by_entity');
      expect(materializationSql).toContain(
        'status_by_entity.entity_type = canonical.process_type',
      );
      expect(materializationSql).toContain(
        'status_by_entity.entity_key = canonical.process_code',
      );
      expect(materializationSql).toContain("THEN 'exact'");
      expect(materializationSql).toContain("THEN 'candidate'");
      expect(materializationSql).toContain("THEN 'unmatched'");
      expect(materializationSql).toContain(
        'ON CONFLICT (process_type, process_code) DO UPDATE',
      );
      expect(materializationSql).not.toContain(
        'DELETE FROM mp.gold_detected_process',
      );
    });
  });

  it('chunks reconciliation upserts before exceeding postgres bind limits', async () => {
    mockSelectExactCodigoExterno(
      Array.from({ length: 5001 }, (_, index) => `L${index + 1}`),
    );
    mockInsert(5000);
    mockInsert(1);
    mockSelectCsvApiSameBusinessKey([]);
    mockSelectExactCodigoLicitacion([]);
    mockSelectCompraAgil([]);

    const result = await service.refreshAllExactReconciliation();

    const insertCalls = (
      mockEntityManager.query as jest.Mock
    ).mock.calls.filter(
      (call: unknown[]) =>
        typeof call[0] === 'string' &&
        (call[0] as string).includes(
          'INSERT INTO mp.reconciliation_public_market_entities',
        ),
    );

    expect(result.exactCodigoExterno).toBe(5001);
    expect(insertCalls).toHaveLength(2);
  });
});
