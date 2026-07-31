import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { type TypedDocumentNode } from '@graphql-typed-document-node/core';

import {
  type GetMercadoPublicoProcessDetailQuery,
  type GetMercadoPublicoProcessDetailQueryVariables,
} from '~/generated/graphql';

type MercadoPublicoCompraAgilDetailExtension = {
  need?: { description?: string | null };
  delivery?: { address?: string | null; leadTimeDays?: number | null };
  budget?: {
    type?: string | null;
    estimated?: number | null;
    available?: number | null;
    availableClp?: number | null;
  };
  suppliers?: Array<{
    rut?: string | null;
    name?: string | null;
    quote: {
      totalAmount?: number | null;
      products?: Array<{
        code?: string | null;
        name?: string | null;
        quantity?: string | null;
        totalAmount?: number | null;
      }>;
    };
  }>;
};

type GetMercadoPublicoProcessDetailV2Query = Omit<
  GetMercadoPublicoProcessDetailQuery,
  'mercadoPublicoProcessDetail'
> & {
  mercadoPublicoProcessDetail?:
    | (Omit<
        NonNullable<
          GetMercadoPublicoProcessDetailQuery['mercadoPublicoProcessDetail']
        >,
        'items' | 'compraAgilSource'
      > & {
        items: Array<
          NonNullable<
            GetMercadoPublicoProcessDetailQuery['mercadoPublicoProcessDetail']
          >['items'][number] & {
            description?: string | null;
            unit?: string | null;
          }
        >;
        compraAgilSource?:
          | (NonNullable<
              NonNullable<
                GetMercadoPublicoProcessDetailQuery['mercadoPublicoProcessDetail']
              >['compraAgilSource']
            > &
              MercadoPublicoCompraAgilDetailExtension)
          | null;
      })
    | null;
};

export const GET_MERCADO_PUBLICO_PROCESS_DETAIL_V2 = gql`
  query GetMercadoPublicoProcessDetailV2(
    $processType: MercadoPublicoDetectedProcessType!
    $processCode: String!
  ) {
    mercadoPublicoProcessDetail(
      processType: $processType
      processCode: $processCode
    ) {
      processType
      processCode
      title
      canonicalState
      sourcePriority
      lastSeenAt
      rawState {
        code
        label
      }
      buyer {
        code
        name
      }
      dates {
        publishedAt
        closingAt
      }
      items {
        code
        name
        description
        quantity
        unit
        amount
      }
      adjudications {
        supplierCode
        quantity
        amount
      }
      relatedOcs {
        code
        canonicalState
        matchType
        matchConfidence
      }
      sourceLineage {
        source
        rowCount
        lastSeenAt
      }
      reconciliationSummary {
        exact
        candidate
        unmatched
        manualReviewRequired
      }
      compraAgilSource {
        sourcePath
        offersReceived
        state {
          id
          code
          label
        }
        additionalDates {
          lastChangedAt
          firstCallClosingAt
          secondCallClosingAt
        }
        amounts {
          currency
          available
          availableClp
        }
        reasons {
          deserted
          selection
          cancellation
        }
        documents {
          id
          name
        }
        institution {
          rut
          regionName
          purchaseUnit
          buyerName
        }
        call {
          description
          state
        }
        need {
          description
        }
        delivery {
          address
          leadTimeDays
        }
        budget {
          type
          estimated
          available
          availableClp
        }
        suppliers {
          rut
          name
          quote {
            totalAmount
            products {
              code
              name
              quantity
              totalAmount
            }
          }
        }
      }
    }
  }
` as TypedDocumentNode<
  GetMercadoPublicoProcessDetailV2Query,
  GetMercadoPublicoProcessDetailQueryVariables
>;

export const useMercadoPublicoProcessDetail = (
  variables: GetMercadoPublicoProcessDetailQueryVariables,
) => {
  const { data, previousData, loading, error, refetch } = useQuery<
    GetMercadoPublicoProcessDetailV2Query,
    GetMercadoPublicoProcessDetailQueryVariables
  >(GET_MERCADO_PUBLICO_PROCESS_DETAIL_V2, {
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
