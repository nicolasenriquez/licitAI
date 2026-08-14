import { useQuery } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

import {
  GetMercadoPublicoJobRunsDocument,
  type GetMercadoPublicoJobRunsQuery,
  type GetMercadoPublicoJobRunsQueryVariables,
} from '~/generated/mercado-publico-legacy.graphql';

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

type UseMercadoPublicoJobRunsOptions = {
  skip?: boolean;
};

export const useMercadoPublicoJobRuns = (
  variables: UseMercadoPublicoJobRunsVariables = {},
  options: UseMercadoPublicoJobRunsOptions = {},
) => {
  const apolloCoreClient = useApolloCoreClient();
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
    client: apolloCoreClient,
    variables: serializedVariables,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    skip: options.skip,
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
