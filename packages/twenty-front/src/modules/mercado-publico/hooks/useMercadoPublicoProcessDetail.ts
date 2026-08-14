import { useQuery } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

import {
  GetMercadoPublicoProcessDetailDocument,
  type GetMercadoPublicoProcessDetailQuery,
  type GetMercadoPublicoProcessDetailQueryVariables,
} from '~/generated/mercado-publico-legacy.graphql';

export const useMercadoPublicoProcessDetail = (
  variables: GetMercadoPublicoProcessDetailQueryVariables,
) => {
  const apolloCoreClient = useApolloCoreClient();
  const { data, previousData, loading, error, refetch } = useQuery<
    GetMercadoPublicoProcessDetailQuery,
    GetMercadoPublicoProcessDetailQueryVariables
  >(GetMercadoPublicoProcessDetailDocument, {
    client: apolloCoreClient,
    variables,
    notifyOnNetworkStatusChange: true,
  });

  const effectiveData = data ?? previousData;

  return {
    data: effectiveData,
    processDetail: effectiveData?.mercadoPublicoProcessDetail,
    loading,
    isInitialLoading: loading && !effectiveData,
    isRefetching: loading && !!previousData,
    error,
    refetch,
  };
};
