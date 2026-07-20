import { useQuery } from '@apollo/client/react';

import {
  GetMercadoPublicoProcessDetailDocument,
  type GetMercadoPublicoProcessDetailQuery,
  type GetMercadoPublicoProcessDetailQueryVariables,
} from '~/generated/graphql';

export const useMercadoPublicoProcessDetail = (
  variables: GetMercadoPublicoProcessDetailQueryVariables,
) => {
  const { data, previousData, loading, error, refetch } = useQuery<
    GetMercadoPublicoProcessDetailQuery,
    GetMercadoPublicoProcessDetailQueryVariables
  >(GetMercadoPublicoProcessDetailDocument, {
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
