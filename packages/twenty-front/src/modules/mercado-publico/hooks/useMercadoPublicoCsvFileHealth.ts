import { useQuery } from '@apollo/client/react';

import {
  GetMercadoPublicoCsvFileHealthDocument,
  type GetMercadoPublicoCsvFileHealthQuery,
} from '~/generated/mercado-publico-legacy.graphql';

export const useMercadoPublicoCsvFileHealth = () => {
  const { data, previousData, loading, error, refetch } =
    useQuery<GetMercadoPublicoCsvFileHealthQuery>(
      GetMercadoPublicoCsvFileHealthDocument,
      {
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
