import { useQuery } from '@apollo/client/react';

import {
  GetMercadoPublicoApiQuotaUsageDocument,
  type GetMercadoPublicoApiQuotaUsageQuery,
} from '~/generated/graphql';

export const useMercadoPublicoApiQuotaUsage = () => {
  const { data, previousData, loading, error, refetch } =
    useQuery<GetMercadoPublicoApiQuotaUsageQuery>(
      GetMercadoPublicoApiQuotaUsageDocument,
      {
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
