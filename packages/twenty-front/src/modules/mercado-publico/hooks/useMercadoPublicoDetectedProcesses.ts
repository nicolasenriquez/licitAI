import { useQuery } from '@apollo/client/react';

import {
  GetMercadoPublicoDetectedProcessesDocument,
  type GetMercadoPublicoDetectedProcessesQuery,
  type GetMercadoPublicoDetectedProcessesQueryVariables,
} from '~/generated/graphql';

import {
  type MercadoPublicoDateInput,
  omitUndefinedMercadoPublicoVariables,
  serializeMercadoPublicoDate,
  serializeMercadoPublicoDateEndOfDay,
} from './mercadoPublicoQueryHelpers';

export type UseMercadoPublicoDetectedProcessesVariables = Omit<
  GetMercadoPublicoDetectedProcessesQueryVariables,
  'publishedFrom' | 'publishedTo' | 'changedSince' | 'closingFrom' | 'closingTo'
> & {
  publishedFrom?: MercadoPublicoDateInput;
  publishedTo?: MercadoPublicoDateInput;
  changedSince?: MercadoPublicoDateInput;
  closingFrom?: MercadoPublicoDateInput;
  closingTo?: MercadoPublicoDateInput;
};

export const useMercadoPublicoDetectedProcesses = (
  variables: UseMercadoPublicoDetectedProcessesVariables = {},
) => {
  const serializedVariables =
    omitUndefinedMercadoPublicoVariables<GetMercadoPublicoDetectedProcessesQueryVariables>(
      {
        ...variables,
        publishedFrom: serializeMercadoPublicoDate(variables.publishedFrom),
        publishedTo: serializeMercadoPublicoDateEndOfDay(
          variables.publishedTo,
          'America/Santiago',
        ),
        changedSince: serializeMercadoPublicoDate(variables.changedSince),
        closingFrom: serializeMercadoPublicoDate(variables.closingFrom),
        closingTo: serializeMercadoPublicoDateEndOfDay(
          variables.closingTo,
          'America/Santiago',
        ),
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
