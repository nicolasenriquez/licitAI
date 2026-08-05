import { useQuery } from '@apollo/client/react';

import {
  GetMercadoPublicoCompraAgilAnalyticsDocument,
  type GetMercadoPublicoCompraAgilAnalyticsQuery,
  type GetMercadoPublicoCompraAgilAnalyticsQueryVariables,
} from '~/generated/graphql';

import {
  type MercadoPublicoDateInput,
  omitUndefinedMercadoPublicoVariables,
  serializeMercadoPublicoDate,
  serializeMercadoPublicoDateEndOfDay,
} from './mercadoPublicoQueryHelpers';

export type UseMercadoPublicoCompraAgilAnalyticsVariables = Omit<
  GetMercadoPublicoCompraAgilAnalyticsQueryVariables,
  'closingFrom' | 'closingTo'
> & {
  closingFrom?: MercadoPublicoDateInput;
  closingTo?: MercadoPublicoDateInput;
};

export const useMercadoPublicoCompraAgilAnalytics = (
  variables: UseMercadoPublicoCompraAgilAnalyticsVariables = {},
) => {
  const serializedVariables =
    omitUndefinedMercadoPublicoVariables<GetMercadoPublicoCompraAgilAnalyticsQueryVariables>(
      {
        ...variables,
        closingFrom: serializeMercadoPublicoDate(variables.closingFrom),
        closingTo: serializeMercadoPublicoDateEndOfDay(
          variables.closingTo,
          'America/Santiago',
        ),
      },
    );

  const { data, previousData, loading, error, refetch } = useQuery<
    GetMercadoPublicoCompraAgilAnalyticsQuery,
    GetMercadoPublicoCompraAgilAnalyticsQueryVariables
  >(GetMercadoPublicoCompraAgilAnalyticsDocument, {
    variables: serializedVariables,
    notifyOnNetworkStatusChange: true,
  });

  const effectiveData = data ?? previousData;

  return {
    data: effectiveData,
    analytics: effectiveData?.mercadoPublicoCompraAgilAnalytics,
    loading,
    isInitialLoading: loading && !effectiveData,
    isRefetching: loading && !!previousData,
    error,
    refetch,
  };
};
