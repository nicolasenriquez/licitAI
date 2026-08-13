import { useQuery } from '@apollo/client/react';

import {
  GetMercadoPublicoDetectedProcessesDocument,
  type GetMercadoPublicoDetectedProcessesQuery,
  type GetMercadoPublicoDetectedProcessesQueryVariables,
} from '~/generated/mercado-publico-legacy.graphql';

import {
  type MercadoPublicoDateInput,
  omitUndefinedMercadoPublicoVariables,
  serializeMercadoPublicoDate,
} from './mercadoPublicoQueryHelpers';

export type UseMercadoPublicoDetectedProcessesVariables = Omit<
  GetMercadoPublicoDetectedProcessesQueryVariables,
  'publishedFrom' | 'publishedTo' | 'changedSince'
> & {
  publishedFrom?: MercadoPublicoDateInput;
  publishedTo?: MercadoPublicoDateInput;
  changedSince?: MercadoPublicoDateInput;
};

export const useMercadoPublicoDetectedProcesses = (
  variables: UseMercadoPublicoDetectedProcessesVariables = {},
) => {
  const serializedVariables =
    omitUndefinedMercadoPublicoVariables<GetMercadoPublicoDetectedProcessesQueryVariables>(
      {
        ...variables,
        publishedFrom: serializeMercadoPublicoDate(variables.publishedFrom),
        publishedTo: serializeMercadoPublicoDate(variables.publishedTo),
        changedSince: serializeMercadoPublicoDate(variables.changedSince),
      },
    );

  const { data, previousData, loading, error, refetch } = useQuery<
    GetMercadoPublicoDetectedProcessesQuery,
    GetMercadoPublicoDetectedProcessesQueryVariables
  >(GetMercadoPublicoDetectedProcessesDocument, {
    variables: serializedVariables,
    notifyOnNetworkStatusChange: true,
  });

  const effectiveData = data ?? previousData;

  return {
    data: effectiveData,
    processes: effectiveData?.mercadoPublicoDetectedProcesses,
    loading,
    isInitialLoading: loading && !effectiveData,
    isRefetching: loading && !!previousData,
    error,
    refetch,
  };
};
