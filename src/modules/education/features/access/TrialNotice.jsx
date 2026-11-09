import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { Card, Pill } from '../../components/ui/Card.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { date } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

const daysLeft = (expiresAt) => Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
const toolList = (tools) => tools.map((n) => `M${n}`).join(', ');

// Recordatorio en Mi acceso: la prueba gratis dura un mes y solo incluye herramientas.
export function TrialNotice() {
  const { access } = useAuth();
  const trial = access?.trial;
  if (!trial?.active) return null;
  const params = new URLSearchParams(window.location.search);
  const checkpoint = params.get('prueba');
  return (
    <Card id="prueba-gratis" className="trial-notice" title={tr('Prueba gratis de 1 mes')} actions={<Pill variant="warn">{tr('{n} días restantes', { n: daysLeft(trial.expiresAt) })}</Pill>}>
      {checkpoint && <p><b>{tr('¡Completaste el {module}!', { module: checkpoint })}</b> {tr('Recuerda que estás usando la prueba gratis.')}</p>}
      <p>{tr('Tu prueba gratis de las herramientas {tools} vence el {date}.', { tools: toolList(trial.tools), date: date(trial.expiresAt) })}</p>
      <p className="small muted">{tr('El resto de la plataforma se desbloquea con una de las formas de adquirir de abajo. Tus datos se conservan cuando pagas.')}</p>
    </Card>
  );
}

// Mensaje al tocar un módulo que no entra en la prueba o en el acceso actual.
export function LockedModuleModal({ module, onClose }) {
  const { basePath } = useWorkspace();
  const { access } = useAuth();
  return (
    <Modal
      open={!!module}
      title={tr('Módulo bloqueado')}
      onClose={onClose}
      footer={<Link className="btn-primary" to={`${basePath}/acceso`} onClick={onClose}>{tr('Ir a Mi acceso')}</Link>}
    >
      {module && (
        <p>
          {access?.trial?.active
            ? tr('El Módulo {n} no está incluido en tu prueba gratis. Para desbloquearlo, dirígete a Mi acceso.', { n: module.number })
            : tr('Para desbloquear el Módulo {n}, dirígete a Mi acceso.', { n: module.number })}
        </p>
      )}
    </Modal>
  );
}
