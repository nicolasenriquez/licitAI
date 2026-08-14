import { useQuery } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

import {
  GetMercadoPublicoPipelineHealthDocument,
  type GetMercadoPublicoPipelineHealthQuery,
} from '~/generated/mercado-publico-legacy.graphql';

export const useMercadoPublicoPipelineHealth = () => {
  const apolloCoreClient = useApolloCoreClient();
  const { data, previousData, loading, error, refetch } =
    useQuery<GetMercadoPublicoPipelineHealthQuery>(
      GetMercadoPublicoPipelineHealthDocument,
      {
        client: apolloCoreClient,
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
