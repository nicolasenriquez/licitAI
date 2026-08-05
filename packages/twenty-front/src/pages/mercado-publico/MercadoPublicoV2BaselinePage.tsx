import { useLingui } from '@lingui/react/macro';

export const MercadoPublicoV2BaselinePage = () => {
  const { t } = useLingui();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '24px',
      }}
    >
      <h1>{t`Mercado Público V2 (baseline)`}</h1>
      <p>
        {t`Baseline reproducible protegido por bandera local. Los slices V2 se
        construyen sobre esta ruta.`}
      </p>
    </div>
  );
};
