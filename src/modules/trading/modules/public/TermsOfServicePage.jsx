import PublicNav from './components/PublicNav';
import PublicFooter from './components/PublicFooter';
import usePublicData from './usePublicData';
import { useLanguage } from '../../i18n/LanguageContext';
import { LegalDocumentView } from '../../components/LegalDocument';

// Página pública del documento legal — su texto lo edita el ADMIN desde el
// CMS (sección "Legal"); es el mismo texto que se acepta en el registro.
export default function TermsOfServicePage() {
  const { text, media } = usePublicData();
  const { t } = useLanguage();

  return (
    <div className="qlc-public">
      <PublicNav />
      <main>
        <LegalDocumentView text={text} t={t} doc="terms" />
      </main>
      <PublicFooter text={text} media={media} />
    </div>
  );
}
