import { ConfigVariablesMaskingStrategies } from 'src/engine/core-modules/twenty-config/enums/config-variables-masking-strategies.enum';

type LastNCharsConfig = {
  strategy: ConfigVariablesMaskingStrategies.LAST_N_CHARS;
  chars: number;
};

type HidePasswordConfig = {
  strategy: ConfigVariablesMaskingStrategies.HIDE_PASSWORD;
};

type MaskingConfigType = {
  APP_SECRET: LastNCharsConfig;
  PG_DATABASE_URL: HidePasswordConfig;
  REDIS_URL: HidePasswordConfig;
  MERCADO_PUBLICO_API_TICKET: LastNCharsConfig;
  COMPRA_AGIL_API_TICKET: LastNCharsConfig;
};

export const CONFIG_VARIABLES_MASKING_CONFIG: MaskingConfigType = {
  APP_SECRET: {
    strategy: ConfigVariablesMaskingStrategies.LAST_N_CHARS,
    chars: 5,
  },
  PG_DATABASE_URL: {
    strategy: ConfigVariablesMaskingStrategies.HIDE_PASSWORD,
  },
  REDIS_URL: {
    strategy: ConfigVariablesMaskingStrategies.HIDE_PASSWORD,
  },
  MERCADO_PUBLICO_API_TICKET: {
    strategy: ConfigVariablesMaskingStrategies.LAST_N_CHARS,
    chars: 5,
  },
  COMPRA_AGIL_API_TICKET: {
    strategy: ConfigVariablesMaskingStrategies.LAST_N_CHARS,
    chars: 5,
  },
} as const;
