import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';
import { Button } from 'twenty-ui/input';

import { MercadoPublicoV2Nav } from '@/mercado-publico/components/MercadoPublicoV2Nav';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import {
  MercadoPublicoV2HistoryDocument,
  type MercadoPublicoV2HistoryQuery,
  type MercadoPublicoV2HistoryQueryVariables,
} from '~/generated/graphql';

const StyledPage = styled.main`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${themeCssVariables.spacing[4]};
  }
`;

const StyledHeader = styled.header`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledHeading = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  margin: 0;
`;

const StyledCode = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  margin: 0;
`;

const StyledStateMessage = styled.p`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  margin: 0;
`;

const StyledEventList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledEvent = styled.li`
  border-left: 2px solid ${themeCssVariables.border.color.medium};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledSectionHeading = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  margin: 0;
`;

const StyledDetailList = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  grid-template-columns: max-content 1fr;
  margin: 0;
`;

const StyledLabel = styled.dt`
  color: ${themeCssVariables.font.color.secondary};
`;

const StyledValue = styled.dd`
  color: ${themeCssVariables.font.color.primary};
  margin: 0;
  overflow-wrap: anywhere;
`;

const StyledPagination = styled.nav`
  display: flex;
`;

const StyledBackLink = styled(Link)`
  align-self: flex-start;
  color: ${themeCssVariables.font.color.primary};
  text-decoration: underline;
`;

export const getMercadoPublicoV2HistoryReturnTo = (
  returnTo: string | null,
  codigo: string | null,
): string => {
  if (
    returnTo === AppPath.MercadoPublico ||
    returnTo?.startsWith(`${AppPath.MercadoPublico}?`) ||
    returnTo?.startsWith(`${AppPath.MercadoPublico}/`)
  ) {
    return returnTo;
  }

  const fallback = new URLSearchParams();
  if (codigo) fallback.set('proceso', codigo);

  return `${AppPath.MercadoPublico}${fallback.size > 0 ? `?${fallback}` : ''}`;
};

const valueOrFallback = (
  value: string | null | undefined,
  t: ReturnType<typeof useLingui>['t'],
): string => value ?? t({ message: 'No disponible' });

export const MercadoPublicoV2HistoryPage = () => {
  const { t } = useLingui();
  const [searchParams, setSearchParams] = useSearchParams();
  const codigo = searchParams.get('codigo');
  const after = searchParams.get('after');
  const returnTo = getMercadoPublicoV2HistoryReturnTo(
    searchParams.get('returnTo'),
    codigo,
  );
  const apolloCoreClient = useApolloCoreClient();

  const { data, error, loading, refetch } = useQuery<
    MercadoPublicoV2HistoryQuery,
    MercadoPublicoV2HistoryQueryVariables
  >(MercadoPublicoV2HistoryDocument, {
    client: apolloCoreClient,
    variables: { codigo: codigo ?? '', after, first: 50 },
    skip: codigo === null || codigo === '',
  });

  const goToNextPage = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    const endCursor = data?.mercadoPublicoV2.history.pageInfo.endCursor;

    if (endCursor !== null && endCursor !== undefined) {
      next.set('after', endCursor);
    } else {
      next.delete('after');
    }

    setSearchParams(next);
  }, [data, searchParams, setSearchParams]);

  const connection = data?.mercadoPublicoV2.history;

  return (
    <StyledPage>
      <StyledHeader>
        <StyledHeading>{t`Historial`}</StyledHeading>
        <MercadoPublicoV2Nav />
      </StyledHeader>

      <StyledBackLink to={returnTo}>{t`Volver a procesos`}</StyledBackLink>

      {codigo === null || codigo === '' ? (
        <StyledStateMessage role="status" aria-live="polite">
          {t`Selecciona un proceso para consultar su historial`}
        </StyledStateMessage>
      ) : (
        <>
          <StyledCode>{t`Proceso ${codigo}`}</StyledCode>

          {loading && (
            <StyledStateMessage role="status" aria-live="polite">
              {t`Cargando historial…`}
            </StyledStateMessage>
          )}

          {!loading && error && (
            <StyledStateMessage role="alert">
              <span>{t`No fue posible cargar el historial.`}</span>
              <Button
                title={t`Reintentar historial`}
                type="button"
                size="small"
                variant="secondary"
                onClick={() => void refetch()}
              />
            </StyledStateMessage>
          )}

          {!loading && !error && connection?.edges.length === 0 && (
            <StyledStateMessage role="status" aria-live="polite">
              {t`No hay cambios semánticos registrados para este proceso.`}
            </StyledStateMessage>
          )}

          {!loading && !error && connection && connection.edges.length > 0 && (
            <>
              <StyledEventList>
                {connection.edges.map(({ node }) => (
                  <StyledEvent key={node.id}>
                    <StyledSectionHeading>
                      {t`Cambios semánticos`}
                    </StyledSectionHeading>
                    <StyledDetailList>
                      <StyledLabel>{t`Campos modificados`}</StyledLabel>
                      <StyledValue>
                        {node.changedFields.length > 0
                          ? node.changedFields.join(', ')
                          : t`Ninguno`}
                      </StyledValue>
                      <StyledLabel>{t`Observación anterior`}</StyledLabel>
                      <StyledValue>
                        {valueOrFallback(node.previousObservationId, t)}
                      </StyledValue>
                      <StyledLabel>{t`Observación nueva`}</StyledLabel>
                      <StyledValue>
                        {valueOrFallback(node.newObservationId, t)}
                      </StyledValue>
                    </StyledDetailList>

                    <StyledSectionHeading>
                      {t`Procedencia`}
                    </StyledSectionHeading>
                    <StyledDetailList>
                      <StyledLabel>{t`Normalizador`}</StyledLabel>
                      <StyledValue>
                        {valueOrFallback(node.normalizerVersion, t)}
                      </StyledValue>
                      <StyledLabel>{t`Fingerprint del esquema`}</StyledLabel>
                      <StyledValue>
                        {valueOrFallback(node.providerSchemaFingerprint, t)}
                      </StyledValue>
                      <StyledLabel>{t`Fuente`}</StyledLabel>
                      <StyledValue>
                        {valueOrFallback(node.source, t)}
                      </StyledValue>
                      <StyledLabel>{t`Endpoint`}</StyledLabel>
                      <StyledValue>
                        {valueOrFallback(node.endpoint, t)}
                      </StyledValue>
                      <StyledLabel>{t`Snapshot`}</StyledLabel>
                      <StyledValue>
                        {valueOrFallback(node.snapshotKind, t)}
                      </StyledValue>
                      <StyledLabel>{t`Cambiado por proveedor`}</StyledLabel>
                      <StyledValue>
                        {valueOrFallback(node.providerChangedAt, t)}
                      </StyledValue>
                      <StyledLabel>{t`Observado`}</StyledLabel>
                      <StyledValue>
                        {valueOrFallback(node.observedAt, t)}
                      </StyledValue>
                      <StyledLabel>{t`Registrado`}</StyledLabel>
                      <StyledValue>{node.createdAt}</StyledValue>
                    </StyledDetailList>
                  </StyledEvent>
                ))}
              </StyledEventList>

              {connection.pageInfo.hasNextPage && (
                <StyledPagination aria-label={t`Paginación de historial`}>
                  <Button
                    title={t`Siguiente`}
                    type="button"
                    size="small"
                    variant="secondary"
                    onClick={goToNextPage}
                  />
                </StyledPagination>
              )}
            </>
          )}
        </>
      )}
    </StyledPage>
  );
};
