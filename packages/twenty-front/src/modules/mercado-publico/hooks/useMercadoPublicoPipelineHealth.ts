import { useQuery } from '@apollo/client/react';

import {
  GetMercadoPublicoPipelineHealthDocument,
  type GetMercadoPublicoPipelineHealthQuery,
} from '~/generated/graphql';

export const useMercadoPublicoPipelineHealth = () => {
  const { data, previousData, loading, error, refetch } =
    useQuery<GetMercadoPublicoPipelineHealthQuery>(
      GetMercadoPublicoPipelineHealthDocument,
      {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
      },
    );

  const effectiveData = data ?? previousData;

  return {
    data: effectiveData,
    pipelineHealth: effectiveData?.mercadoPublicoPipelineHealth,
    loading,
    isInitialLoading: loading && !effectiveData,
    isRefetching: loading && !!previousData,
    error,
    refetch,
  };
};
