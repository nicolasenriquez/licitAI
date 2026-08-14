import { useQuery } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

import {
  GetMercadoPublicoApiQuotaUsageDocument,
  type GetMercadoPublicoApiQuotaUsageQuery,
} from '~/generated/mercado-publico-legacy.graphql';

export const useMercadoPublicoApiQuotaUsage = () => {
  const apolloCoreClient = useApolloCoreClient();
  const { data, previousData, loading, error, refetch } =
    useQuery<GetMercadoPublicoApiQuotaUsageQuery>(
      GetMercadoPublicoApiQuotaUsageDocument,
      {
        client: apolloCoreClient,
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
      },
    );

  const effectiveData = data ?? previousData;

  return {
    data: effectiveData,
    apiQuotaUsage: effectiveData?.mercadoPublicoApiQuotaUsage,
    loading,
    isInitialLoading: loading && !effectiveData,
    isRefetching: loading && !!previousData,
    error,
    refetch,
  };
};
