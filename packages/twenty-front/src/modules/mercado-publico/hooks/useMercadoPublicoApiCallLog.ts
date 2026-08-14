import { useQuery } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

import {
  GetMercadoPublicoApiCallLogDocument,
  type GetMercadoPublicoApiCallLogQuery,
  type GetMercadoPublicoApiCallLogQueryVariables,
} from '~/generated/mercado-publico-legacy.graphql';

type UseMercadoPublicoApiCallLogOptions = {
  skip?: boolean;
};

export const useMercadoPublicoApiCallLog = (
  variables: GetMercadoPublicoApiCallLogQueryVariables = {},
  options: UseMercadoPublicoApiCallLogOptions = {},
) => {
  const apolloCoreClient = useApolloCoreClient();
  const { data, previousData, loading, error, refetch } = useQuery<
    GetMercadoPublicoApiCallLogQuery,
    GetMercadoPublicoApiCallLogQueryVariables
  >(GetMercadoPublicoApiCallLogDocument, {
    client: apolloCoreClient,
    variables,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    skip: options.skip,
  });

  const effectiveData = data ?? previousData;

  return {
    data: effectiveData,
    callLog: effectiveData?.mercadoPublicoApiCallLog,
    loading,
    isInitialLoading: loading && !effectiveData,
    isRefetching: loading && !!previousData,
    error,
    refetch,
  };
};
