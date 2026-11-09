import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function ComoFuncionaSection({ text, media = () => [] }) {
  const { t } = useLanguage();

  const FLOW = [
    { label: t('comoFuncionaSection.flow01Label'), text: t('comoFuncionaSection.flow01Text') },
    { label: t('comoFuncionaSection.flow02Label'), text: t('comoFuncionaSection.flow02Text') },
    { label: t('comoFuncionaSection.flow03Label'), text: t('comoFuncionaSection.flow03Text') },
    { label: t('comoFuncionaSection.flow04Label'), text: t('comoFuncionaSection.flow04Text') },
    { label: t('comoFuncionaSection.flow05Label'), text: t('comoFuncionaSection.flow05Text') },
  ];

  return (
    <section className="section" id="como-funciona">
      <div className="container">
        <div className="kicker">{text('como_funciona', 'kicker', 'CÓMO FUNCIONA')}</div>
        <h2>
          {text('como_funciona', 'h2_line1', 'Tu cuenta.')}
          <br />
          <span className="gradient">{text('como_funciona', 'h2_line2', 'Nuestra infraestructura.')}</span>
        </h2>
        <p className="sub">
          {text(
            'como_funciona',
            'sub',
            'El flujo es directo: el cliente mantiene su cuenta en el exchange, autoriza una conexión API y QLC ejecuta la estrategia directamente sobre ella.'
          )}
        </p>

        <div className="connection">
          <div className="connection-copy">
            <div className="kicker">{t('comoFuncionaSection.directConnection')}</div>
            <h3>{text('como_funciona', 'connection_title', 'El capital permanece donde pertenece.')}</h3>
            <p>
              {text(
                'como_funciona',
                'connection_text',
                'QLC no necesita recibir ni trasladar el capital del cliente para ejecutar la estrategia. La conexión API permite la operación sobre la cuenta autorizada, con permisos limitados y sin autorización para retirar fondos.'
              )}
            </p>
            <div className="statusbar">
              <span className="status ok">{t('comoFuncionaSection.clientAccount')}</span>
              <span className="status ok">{t('comoFuncionaSection.apiAuthorized')}</span>
              <span className="status ok">{t('comoFuncionaSection.noWithdrawals')}</span>
            </div>
          </div>
          <div className="flow-line">
            {FLOW.map((f) => (
              <div className="flow-node" key={f.label}>
                <b>{f.label}</b>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <SectionMedia items={media('como_funciona')} />
      </div>
    </section>
  );
}
