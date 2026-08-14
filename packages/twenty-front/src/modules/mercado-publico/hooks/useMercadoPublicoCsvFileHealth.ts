import { useQuery } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

import {
  GetMercadoPublicoCsvFileHealthDocument,
  type GetMercadoPublicoCsvFileHealthQuery,
} from '~/generated/mercado-publico-legacy.graphql';

export const useMercadoPublicoCsvFileHealth = () => {
  const apolloCoreClient = useApolloCoreClient();
  const { data, previousData, loading, error, refetch } =
    useQuery<GetMercadoPublicoCsvFileHealthQuery>(
      GetMercadoPublicoCsvFileHealthDocument,
      {
        client: apolloCoreClient,
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
      },
    );

  const effectiveData = data ?? previousData;

  return {
    data: effectiveData,
    csvFileHealth: effectiveData?.mercadoPublicoCsvFileHealth,
    loading,
    isInitialLoading: loading && !effectiveData,
    isRefetching: loading && !!previousData,
    error,
    refetch,
  };
};
