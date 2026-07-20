import { useQuery } from '@apollo/client/react';

import {
  GetMercadoPublicoApiCallLogDocument,
  type GetMercadoPublicoApiCallLogQuery,
  type GetMercadoPublicoApiCallLogQueryVariables,
} from '~/generated/graphql';

export const useMercadoPublicoApiCallLog = (
  variables: GetMercadoPublicoApiCallLogQueryVariables = {},
) => {
  const { data, previousData, loading, error, refetch } = useQuery<
    GetMercadoPublicoApiCallLogQuery,
    GetMercadoPublicoApiCallLogQueryVariables
  >(GetMercadoPublicoApiCallLogDocument, {
    variables,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
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
