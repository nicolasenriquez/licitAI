import { useQuery } from '@apollo/client/react';

import {
  GetMercadoPublicoJobRunsDocument,
  type GetMercadoPublicoJobRunsQuery,
  type GetMercadoPublicoJobRunsQueryVariables,
} from '~/generated/graphql';

import {
  type MercadoPublicoDateInput,
  omitUndefinedMercadoPublicoVariables,
  serializeMercadoPublicoDate,
} from './mercadoPublicoQueryHelpers';

export type UseMercadoPublicoJobRunsVariables = Omit<
  GetMercadoPublicoJobRunsQueryVariables,
  'startedFrom' | 'startedTo'
> & {
  startedFrom?: MercadoPublicoDateInput;
  startedTo?: MercadoPublicoDateInput;
};

export const useMercadoPublicoJobRuns = (
  variables: UseMercadoPublicoJobRunsVariables = {},
) => {
  const serializedVariables =
    omitUndefinedMercadoPublicoVariables<GetMercadoPublicoJobRunsQueryVariables>(
      {
        ...variables,
        startedFrom: serializeMercadoPublicoDate(variables.startedFrom),
        startedTo: serializeMercadoPublicoDate(variables.startedTo),
      },
    );

  const { data, previousData, loading, error, refetch } = useQuery<
    GetMercadoPublicoJobRunsQuery,
    GetMercadoPublicoJobRunsQueryVariables
  >(GetMercadoPublicoJobRunsDocument, {
    variables: serializedVariables,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  const effectiveData = data ?? previousData;

  return {
    data: effectiveData,
    jobRuns: effectiveData?.mercadoPublicoJobRuns,
    loading,
    isInitialLoading: loading && !effectiveData,
    isRefetching: loading && !!previousData,
    error,
    refetch,
  };
};
