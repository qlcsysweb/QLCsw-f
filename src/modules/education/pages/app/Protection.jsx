import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePeriodSummary } from '../../hooks/usePeriodSummary.js';
import { money, shortMonth } from '../../utils/format.js';
import { Card, Notice, PageHeader, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { BarChart } from '../../components/charts/Charts.jsx';
import { ClosedNotice } from '../../components/finance/Finance.jsx';
import { RecordManager } from '../../features/records/RecordManager.jsx';
import { RequirePeriod } from '../../features/periods/PeriodControls.jsx';
import { INSURANCE_TYPES, PROTECTION_TYPES, options } from '../../utils/labels.js';
import { DebtCostCard, EmergencyFundCard, usePatrimonial } from '../../features/patrimonial/PatrimonialCards.jsx';
import { ProtectionReadingCard } from '../../features/patrimonial/ProtectionReading.jsx';
import { tr } from '../../i18n/tr.js';

const isInsurance = (v) => INSURANCE_TYPES.includes(v.type);

const fields = [
  { name: 'type', label: 'Tipo', type: 'select', options: options.protection, display: (v) => PROTECTION_TYPES[v] },
  { name: 'name', label: 'Nombre / descripción', hint: (v) => (isInsurance(v) ? tr('Ej. Seguro de vida familiar, seguro del auto.') : null) },
  { name: 'insurer', label: 'Aseguradora', when: isInsurance, maxLength: 120 },
  { name: 'policyNumber', label: 'Número de póliza', when: isInsurance, maxLength: 80 },
  { name: 'claimsNumber', label: 'Número para reportar siniestros (opcional)', when: isInsurance, required: false, maxLength: 80, hint: tr('El teléfono o número que te da la aseguradora para reportar un siniestro.') },
  { name: 'amount', label: 'Importe o suma asegurada', type: 'money', display: money, hint: 'En seguros registra la suma asegurada: no se suma como activo.' },
  { name: 'notes', label: 'Notas', type: 'textarea', required: false },
  { name: 'policyFile', label: 'Póliza en PDF o imagen (opcional)', type: 'file', accept: 'application/pdf,image/jpeg,image/png,image/webp', when: isInsurance, required: false, hint: tr('Máximo 10 MB. Se guarda de forma privada.') },
];

const columns = [
  { key: 'type', label: 'Tipo', render: (r) => PROTECTION_TYPES[r.type] },
  { key: 'name', label: 'Nombre', render: (r) => <>{r.name}{r.insurer && <span className="small block">{r.insurer} · {tr('Póliza')} {r.policyNumber}{r.claimsNumber ? ` · ${tr('Siniestros')}: ${r.claimsNumber}` : ''}</span>}</> },
  { key: 'amount', label: 'Importe', align: 'right', render: (r) => `${money(r.amount)}${INSURANCE_TYPES.includes(r.type) ? ' (cobertura)' : ''}` },
];

function PolicyActions({ record, refresh }) {
  const { api } = useWorkspace();
  const [state, setState] = useState({ busy: false, error: null });
  if (!INSURANCE_TYPES.includes(record.type)) return null;
  const run = async (fn) => {
    setState({ busy: true, error: null });
    try {
      await fn();
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  const upload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    run(async () => {
      await api.upload(`/protection/${record.id}/policy`, form);
      await refresh();
    });
  };
  const open = () => run(async () => {
    const { url } = await api.get(`/protection/${record.id}/policy`);
    window.open(url, '_blank', 'noopener');
  });
  return (
    <>
      {record.policyFileId
        ? <button type="button" className="btn-link" onClick={open} disabled={state.busy}>{tr('Ver póliza')}</button>
        : (
          <label className="btn-link">
            {state.busy ? tr('Cargando…') : tr('Cargar póliza (opcional)')}
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden onChange={upload} />
          </label>
        )}
      {state.error && <span className="small down">{state.error.message}</span>}
    </>
  );
}

function Body() {
  const { api } = useWorkspace();
  const { summary: s, reload, period } = usePeriodSummary();
  const hist = useAsync(() => api.get('/periods/history'), [api, period?.id]);
  const patrimonial = usePatrimonial();
  const [openNew, setOpenNew] = useState(0);
  const register = () => {
    document.getElementById('protection-records')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setOpenNew((n) => n + 1);
  };
  const uploadPolicy = async (record, values) => {
    if (!values.policyFile || !record?.id) return;
    const form = new FormData();
    form.append('file', values.policyFile);
    await api.upload(`/protection/${record.id}/policy`, form);
  };
  const i = s?.indicators;
  return (
    <>
      <PageHeader title={tr('Protección patrimonial')} subtitle={tr('Antes de hacer crecer el patrimonio, revisa cómo lo proteges')} />
      <ClosedNotice />
      <Notice>
        {tr('Construir patrimonio no solamente significa hacerlo crecer. También significa protegerlo frente a acontecimientos que puedan generar pérdidas financieras importantes. Registra aquí la liquidez que')}{' '}<b>no</b>{' '}{tr('hayas registrado como producto en Mi portafolio de inversión, para no duplicar activos.')}
      </Notice>
      {s && (
        <StatGrid>
          <StatCard label={tr('Liquidez y reservas')} value={money(s.protection.total)} accent />
          <StatCard label={tr('Meses de gastos cubiertos')} value={i.monthsCovered === null ? 'N/D' : i.monthsCovered} delta={tr('Liquidez / gastos del periodo')} />
          <StatCard label={tr('Gastos médicos mayores')} value={i.hasMedicalInsurance ? tr('Registrado') : tr('Sin registro')} />
          <StatCard label={tr('Seguro de vida')} value={i.hasLifeInsurance ? tr('Registrado') : tr('Sin registro')} />
        </StatGrid>
      )}
      {s && <ProtectionReadingCard protection={s.protection} monthsCovered={i.monthsCovered} onRegister={register} />}
      {patrimonial.data && (
        <div className="layout even">
          <EmergencyFundCard emergency={patrimonial.data.emergency} />
          <DebtCostCard debts={patrimonial.data.debts} />
        </div>
      )}
      <div id="protection-records" />
      <RecordManager endpoint="/protection" openNew={openNew} afterSave={uploadPolicy} title={tr('Liquidez, fondo de emergencia, reservas y coberturas')} addLabel="+ Registrar"
        fields={fields} columns={columns} onChanged={() => { reload(); hist.reload(); patrimonial.reload(); }}
        toForm={(r) => ({ type: r.type, name: r.name, insurer: r.insurer || '', policyNumber: r.policyNumber || '', claimsNumber: r.claimsNumber || '', amount: Number(r.amount), notes: r.notes || '' })}
        rowActions={(r, refresh) => <PolicyActions record={r} refresh={refresh} />}
        emptyText={tr('Registra tu fondo de emergencia, liquidez y coberturas.')} />
      <Card title={tr('Evolución de la liquidez')}>
        <BarChart data={(hist.data || []).map((h) => ({ label: `${shortMonth(h.month)} ${String(h.year).slice(2)}`, value: h.liquidity }))} />
      </Card>
    </>
  );
}

export default function Protection() {
  return <RequirePeriod><Body /></RequirePeriod>;
}
