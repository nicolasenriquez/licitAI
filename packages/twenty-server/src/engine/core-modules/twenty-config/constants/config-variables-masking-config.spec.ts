import { ConfigVariablesMaskingStrategies } from 'src/engine/core-modules/twenty-config/enums/config-variables-masking-strategies.enum';

import { CONFIG_VARIABLES_MASKING_CONFIG } from './config-variables-masking-config';

describe('CONFIG_VARIABLES_MASKING_CONFIG', () => {
  it('should mask Mercado Publico tickets as opaque secrets instead of URLs', () => {
    expect(CONFIG_VARIABLES_MASKING_CONFIG.MERCADO_PUBLICO_API_TICKET).toEqual({
      strategy: ConfigVariablesMaskingStrategies.LAST_N_CHARS,
      chars: 5,
    });

    expect(CONFIG_VARIABLES_MASKING_CONFIG.COMPRA_AGIL_API_TICKET).toEqual({
      strategy: ConfigVariablesMaskingStrategies.LAST_N_CHARS,
      chars: 5,
    });
  });
});
