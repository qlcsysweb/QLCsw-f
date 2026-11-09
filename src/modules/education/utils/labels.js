const toOptions = (map) => Object.entries(map).map(([value, label]) => ({ value, label }));

export const INCOME_CATEGORIES = {
  SALARIO: 'Salario', NEGOCIO: 'Negocio', RENTAS: 'Rentas', DIVIDENDOS: 'Dividendos', INTERESES: 'Intereses', OTROS: 'Otros',
};

export const EXPENSE_CATEGORIES = {
  VIVIENDA: 'Renta de vivienda', ALIMENTACION: 'Alimentación', SERVICIOS: 'Servicios', TRANSPORTE: 'Transporte', SEGUROS: 'Seguros',
  EDUCACION: 'Educación', ENTRETENIMIENTO: 'Entretenimiento', VIAJES: 'Viajes', DEUDAS: 'Deudas', OTROS: 'Otros',
};

export const PROTECTION_TYPES = {
  LIQUIDEZ: 'Liquidez', FONDO_EMERGENCIA: 'Fondo de emergencia', RESERVA: 'Reserva',
  SEGURO_GASTOS_MEDICOS: 'Seguro de gastos médicos mayores', SEGURO_VIDA: 'Seguro de vida', SEGURO_AUTO: 'Seguro de auto',
  SEGURO_DESEMPLEO: 'Seguro de desempleo', SEGURO_EDUCACION: 'Seguro educativo', SEGURO_RETIRO: 'Seguro de retiro o renta vitalicia', OTRO_SEGURO: 'Otro seguro', META_PATRIMONIAL: 'Meta patrimonial',
};
export const INSURANCE_TYPES = ['SEGURO_GASTOS_MEDICOS', 'SEGURO_VIDA', 'SEGURO_AUTO', 'SEGURO_DESEMPLEO', 'SEGURO_EDUCACION', 'SEGURO_RETIRO', 'OTRO_SEGURO'];

export const MOVEMENT_TYPES = { APORTACION: 'Aportación', DEDUCCION: 'Deducción' };

export const APPOINTMENT_STATUS = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' };
export const APPOINTMENT_CHANNELS = { CHAT_INTERNO: 'Chat interno', VIDEOLLAMADA: 'Videollamada', LLAMADA: 'Llamada', WHATSAPP: 'WhatsApp', PRESENCIAL: 'Presencial' };
export const APPOINTMENT_REASONS = [
  'Organización financiera', 'Planificación de metas', 'Presupuesto', 'Deudas',
  'Construcción patrimonial', 'Diversificación', 'Educación sobre inversiones',
];

export const ACCESS_MODES = { FULL: 'Acceso completo anual', TOOLS: 'Solo herramientas', TRIAL: 'Prueba gratis de 1 mes', NONE: 'Sin acceso' };
export const PAYMENT_STATUS = { PENDING: 'Pendiente', APPROVED: 'Aprobado', REJECTED: 'Rechazado' };

export const ADMIN_LEVELS = { VIEW: 'Visualización', EDIT: 'Edición', FULL: 'Administración completa' };

export const PRODUCT_TYPES = {
  RENTA_FIJA: 'Renta fija', RENTA_VARIABLE: 'Renta variable', FONDOS: 'Fondos', ACCIONES: 'Acciones',
  BIENES_RAICES: 'Bienes raíces', NEGOCIO: 'Negocio', ACTIVO_DIGITAL: 'Activo digital', ALTO_RIESGO: 'Alto riesgo', LIQUIDEZ: 'Liquidez',
};
export const HORIZONS = { CORTO: 'Corto plazo', MEDIANO: 'Mediano plazo', LARGO: 'Largo plazo' };
export const LIQUIDITY_LEVELS = { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' };
export const PERCEIVED_RISK = { BAJO: 'Bajo', MEDIO: 'Medio', ALTO: 'Alto', MUY_ALTO: 'Muy alto' };
export const RISK_TOLERANCE = { CONSERVADOR: 'Conservador', MODERADO: 'Moderado', ALTO: 'Alto' };
export const FINANCIAL_GOALS = {
  CONSTRUIR_PATRIMONIO: 'Construir patrimonio', FONDO_EMERGENCIA: 'Crear fondo de emergencia',
  INVERTIR_MEJOR: 'Invertir mejor', REDUCIR_DEUDAS: 'Reducir deudas', OTRO: 'Otro: escribir mi objetivo…',
};
export const AUTOMATION_LEVELS = { MANUAL: 'Manual', SEMI: 'Semiautomatizado', AUTO: 'Automatizado' };
export const MONITORING_LEVELS = { BASIC: 'Básico', CONTINUOUS: 'Continuo', ALERTS: 'Continuo + alertas' };
export const LEVERAGE_OPTIONS = [1, 2, 5, 10, 25, 50, 100, 150];

export const MODULE_STATE = {
  COMPLETED: { label: 'Completado', tone: 'good' },
  AVAILABLE: { label: 'Disponible', tone: 'info' },
  LOCKED_ORDER: { label: 'Completa el módulo anterior', tone: 'muted' },
  LOCKED_ACCESS: { label: 'Requiere acceso', tone: 'warn' },
  LOCKED_FILTER: { label: 'Requiere filtro de mercados', tone: 'warn' },
  LOCKED_ROUTE: { label: 'Elige la Ruta de Mercados', tone: 'warn' },
  COMING_SOON: { label: 'Siguiente etapa', tone: 'muted' },
};

export const options = {
  income: toOptions(INCOME_CATEGORIES),
  expense: toOptions(EXPENSE_CATEGORIES),
  protection: toOptions(PROTECTION_TYPES),
  movement: toOptions(MOVEMENT_TYPES),
  channel: toOptions(APPOINTMENT_CHANNELS),
  productTypes: toOptions(PRODUCT_TYPES),
  horizons: toOptions(HORIZONS),
  liquidity: toOptions(LIQUIDITY_LEVELS),
  risk: toOptions(PERCEIVED_RISK),
  tolerance: toOptions(RISK_TOLERANCE),
  goals: toOptions(FINANCIAL_GOALS),
  automation: toOptions(AUTOMATION_LEVELS),
  monitoring: toOptions(MONITORING_LEVELS),
  leverage: LEVERAGE_OPTIONS.map((l) => ({ value: l, label: `${l}x` })),
};

export const BUDGET_LABELS = { ...EXPENSE_CATEGORIES, FLUJO_DISPONIBLE: 'Flujo disponible', AHORRO: 'Ahorro', INVERSION: 'Inversión' };
export const DEBT_TYPES = {
  TARJETA_CREDITO: 'Tarjeta de crédito', PRESTAMO_PERSONAL: 'Préstamo personal', CREDITO_AUTOMOTRIZ: 'Crédito automotriz',
  HIPOTECA: 'Hipoteca', CREDITO_NOMINA: 'Crédito de nómina', PRESTAMO_FAMILIAR: 'Préstamo familiar', BNPL: 'Compra a meses / BNPL',
  DEUDA_NEGOCIO: 'Deuda de negocio', IMPUESTOS: 'Impuestos pendientes', OTRA: 'Otra obligación',
};
export const TAX_ITEM_TYPES = {
  NEGOCIO: 'Negocio', INVERSION_FINANCIERA: 'Inversión financiera', BIEN_INMUEBLE: 'Bien inmueble', RENTA_ACTIVOS: 'Renta de activos',
  PARTICIPACION_EMPRESA: 'Participación en empresa', CRIPTOACTIVOS: 'Criptoactivos', OTRA: 'Otra inversión',
};
export const RESULT_PERIODS = { MENSUAL: 'Mensual', TRIMESTRAL: 'Trimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual', PERSONALIZADO: 'Personalizado' };
export const SCENARIO_TYPES = { AHORRO: 'Ahorro', INVERSION: 'Inversión', META: 'Meta financiera', EFECTIVO: 'Efectivo', OTRO: 'Otro' };
export const ESSENTIAL_SOURCES = {
  MOVEMENTS: 'Movimientos reales de Ingresos y gastos',
  BUDGET: 'Presupuesto planeado del Módulo 7',
  DECLARED: 'Monto declarado por ti',
  NONE: 'Sin información',
};
export const BLOCK_TITLES = { 1: 'Fundamentos, inversión y riesgo', 2: 'Organización y crecimiento patrimonial' };

options.debtTypes = toOptions(DEBT_TYPES);
options.taxItemTypes = toOptions(TAX_ITEM_TYPES);
options.resultPeriods = toOptions(RESULT_PERIODS);
options.scenarioTypes = toOptions(SCENARIO_TYPES);

const EN = {
  INCOME_CATEGORIES: { SALARIO: 'Salary', NEGOCIO: 'Business', RENTAS: 'Rent', DIVIDENDOS: 'Dividends', INTERESES: 'Interest', OTROS: 'Other' },
  EXPENSE_CATEGORIES: {
    VIVIENDA: 'Housing', ALIMENTACION: 'Food', SERVICIOS: 'Utilities', TRANSPORTE: 'Transportation', SEGUROS: 'Insurance',
    EDUCACION: 'Education', ENTRETENIMIENTO: 'Entertainment', VIAJES: 'Travel', DEUDAS: 'Debts', OTROS: 'Other',
  },
  PROTECTION_TYPES: {
    LIQUIDEZ: 'Liquidity', FONDO_EMERGENCIA: 'Emergency fund', RESERVA: 'Reserve',
    SEGURO_GASTOS_MEDICOS: 'Major medical insurance', SEGURO_VIDA: 'Life insurance', SEGURO_AUTO: 'Car insurance',
    SEGURO_DESEMPLEO: 'Unemployment insurance', SEGURO_EDUCACION: 'Education insurance', SEGURO_RETIRO: 'Retirement or life annuity insurance', OTRO_SEGURO: 'Other insurance',
  },
  MOVEMENT_TYPES: { APORTACION: 'Contribution', DEDUCCION: 'Withdrawal' },
  APPOINTMENT_STATUS: { PENDING: 'Pending', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled' },
  APPOINTMENT_CHANNELS: { CHAT_INTERNO: 'Internal chat', VIDEOLLAMADA: 'Video call', LLAMADA: 'Phone call', WHATSAPP: 'WhatsApp', PRESENCIAL: 'In person' },
  APPOINTMENT_REASONS: ['Financial organization', 'Goal planning', 'Budget', 'Debts', 'Wealth building', 'Diversification', 'Investment education'],
  ACCESS_MODES: { FULL: 'Full annual access', TOOLS: 'Tools only', TRIAL: '1-month free trial', NONE: 'No access' },
  PAYMENT_STATUS: { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' },
  ADMIN_LEVELS: { VIEW: 'View only', EDIT: 'Edit', FULL: 'Full administration' },
  PRODUCT_TYPES: {
    RENTA_FIJA: 'Fixed income', RENTA_VARIABLE: 'Equities', FONDOS: 'Funds', ACCIONES: 'Stocks',
    BIENES_RAICES: 'Real estate', NEGOCIO: 'Business', ACTIVO_DIGITAL: 'Digital asset', ALTO_RIESGO: 'High risk', LIQUIDEZ: 'Liquidity',
  },
  HORIZONS: { CORTO: 'Short term', MEDIANO: 'Medium term', LARGO: 'Long term' },
  LIQUIDITY_LEVELS: { ALTA: 'High', MEDIA: 'Medium', BAJA: 'Low' },
  PERCEIVED_RISK: { BAJO: 'Low', MEDIO: 'Medium', ALTO: 'High', MUY_ALTO: 'Very high' },
  RISK_TOLERANCE: { CONSERVADOR: 'Conservative', MODERADO: 'Moderate', ALTO: 'High' },
  FINANCIAL_GOALS: { CONSTRUIR_PATRIMONIO: 'Build wealth', FONDO_EMERGENCIA: 'Create an emergency fund', INVERTIR_MEJOR: 'Invest better', REDUCIR_DEUDAS: 'Reduce debt', OTRO: 'Other: write my goal…' },
  AUTOMATION_LEVELS: { MANUAL: 'Manual', SEMI: 'Semi-automated', AUTO: 'Automated' },
  MONITORING_LEVELS: { BASIC: 'Basic', CONTINUOUS: 'Continuous', ALERTS: 'Continuous + alerts' },
  MODULE_STATE: {
    COMPLETED: 'Completed', AVAILABLE: 'Available', LOCKED_ORDER: 'Complete the previous module', LOCKED_ACCESS: 'Requires access',
    LOCKED_FILTER: 'Requires the markets filter', LOCKED_ROUTE: 'Choose the Markets Path', COMING_SOON: 'Next stage',
  },
  BUDGET_EXTRA: { FLUJO_DISPONIBLE: 'Available cash flow', AHORRO: 'Savings', INVERSION: 'Investment' },
  DEBT_TYPES: {
    TARJETA_CREDITO: 'Credit card', PRESTAMO_PERSONAL: 'Personal loan', CREDITO_AUTOMOTRIZ: 'Car loan',
    HIPOTECA: 'Mortgage', CREDITO_NOMINA: 'Payroll loan', PRESTAMO_FAMILIAR: 'Family loan', BNPL: 'Installments / BNPL',
    DEUDA_NEGOCIO: 'Business debt', IMPUESTOS: 'Pending taxes', OTRA: 'Other obligation',
  },
  TAX_ITEM_TYPES: {
    NEGOCIO: 'Business', INVERSION_FINANCIERA: 'Financial investment', BIEN_INMUEBLE: 'Real estate property', RENTA_ACTIVOS: 'Asset rental',
    PARTICIPACION_EMPRESA: 'Company stake', CRIPTOACTIVOS: 'Crypto assets', OTRA: 'Other investment',
  },
  RESULT_PERIODS: { MENSUAL: 'Monthly', TRIMESTRAL: 'Quarterly', SEMESTRAL: 'Semiannual', ANUAL: 'Annual', PERSONALIZADO: 'Custom' },
  SCENARIO_TYPES: { AHORRO: 'Savings', INVERSION: 'Investment', META: 'Financial goal', EFECTIVO: 'Cash', OTRO: 'Other' },
  ESSENTIAL_SOURCES: { MOVEMENTS: 'Actual income and expense records', BUDGET: 'Planned budget from Module 7', DECLARED: 'Amount you declared', NONE: 'No information' },
  BLOCK_TITLES: { 1: 'Fundamentals, investing and risk', 2: 'Wealth organization and growth' },
};

const MAPS = {
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, PROTECTION_TYPES, MOVEMENT_TYPES, APPOINTMENT_STATUS, APPOINTMENT_CHANNELS, ACCESS_MODES,
  PAYMENT_STATUS, ADMIN_LEVELS, PRODUCT_TYPES, HORIZONS, LIQUIDITY_LEVELS, PERCEIVED_RISK, RISK_TOLERANCE, FINANCIAL_GOALS,
  AUTOMATION_LEVELS, MONITORING_LEVELS, DEBT_TYPES, TAX_ITEM_TYPES, RESULT_PERIODS, SCENARIO_TYPES, ESSENTIAL_SOURCES, BLOCK_TITLES,
};

const ES = {
  ...Object.fromEntries(Object.entries(MAPS).map(([name, map]) => [name, { ...map }])),
  APPOINTMENT_REASONS: [...APPOINTMENT_REASONS],
  MODULE_STATE: Object.fromEntries(Object.entries(MODULE_STATE).map(([key, state]) => [key, state.label])),
  BUDGET_EXTRA: { FLUJO_DISPONIBLE: BUDGET_LABELS.FLUJO_DISPONIBLE, AHORRO: BUDGET_LABELS.AHORRO, INVERSION: BUDGET_LABELS.INVERSION },
};

const OPTION_SOURCES = {
  income: INCOME_CATEGORIES, expense: EXPENSE_CATEGORIES, protection: PROTECTION_TYPES, movement: MOVEMENT_TYPES, channel: APPOINTMENT_CHANNELS,
  productTypes: PRODUCT_TYPES, horizons: HORIZONS, liquidity: LIQUIDITY_LEVELS, risk: PERCEIVED_RISK, tolerance: RISK_TOLERANCE,
  goals: FINANCIAL_GOALS, automation: AUTOMATION_LEVELS, monitoring: MONITORING_LEVELS, debtTypes: DEBT_TYPES,
  taxItemTypes: TAX_ITEM_TYPES, resultPeriods: RESULT_PERIODS, scenarioTypes: SCENARIO_TYPES,
};

const PT = {
  INCOME_CATEGORIES: { SALARIO: 'Salário', NEGOCIO: 'Negócio', RENTAS: 'Aluguéis', DIVIDENDOS: 'Dividendos', INTERESES: 'Juros', OTROS: 'Outros' },
  EXPENSE_CATEGORIES: {
    VIVIENDA: 'Moradia', ALIMENTACION: 'Alimentação', SERVICIOS: 'Serviços', TRANSPORTE: 'Transporte', SEGUROS: 'Seguros',
    EDUCACION: 'Educação', ENTRETENIMIENTO: 'Entretenimento', VIAJES: 'Viagens', DEUDAS: 'Dívidas', OTROS: 'Outros',
  },
  PROTECTION_TYPES: {
    LIQUIDEZ: 'Liquidez', FONDO_EMERGENCIA: 'Fundo de emergência', RESERVA: 'Reserva',
    SEGURO_GASTOS_MEDICOS: 'Seguro de despesas médicas', SEGURO_VIDA: 'Seguro de vida', SEGURO_AUTO: 'Seguro de automóvel',
    SEGURO_DESEMPLEO: 'Seguro-desemprego', SEGURO_EDUCACION: 'Seguro educacional', SEGURO_RETIRO: 'Seguro de aposentadoria ou renda vitalícia', OTRO_SEGURO: 'Outro seguro',
  },
  MOVEMENT_TYPES: { APORTACION: 'Aporte', DEDUCCION: 'Resgate' },
  APPOINTMENT_STATUS: { PENDING: 'Pendente', CONFIRMED: 'Confirmada', COMPLETED: 'Concluída', CANCELLED: 'Cancelada' },
  APPOINTMENT_CHANNELS: { CHAT_INTERNO: 'Chat interno', VIDEOLLAMADA: 'Videochamada', LLAMADA: 'Ligação', WHATSAPP: 'WhatsApp', PRESENCIAL: 'Presencial' },
  APPOINTMENT_REASONS: ['Organização financeira', 'Planejamento de metas', 'Orçamento', 'Dívidas', 'Construção de patrimônio', 'Diversificação', 'Educação em investimentos'],
  ACCESS_MODES: { FULL: 'Acesso completo anual', TOOLS: 'Somente ferramentas', TRIAL: 'Teste grátis de 1 mês', NONE: 'Sem acesso' },
  PAYMENT_STATUS: { PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Recusado' },
  ADMIN_LEVELS: { VIEW: 'Somente visualização', EDIT: 'Edição', FULL: 'Administração completa' },
  PRODUCT_TYPES: {
    RENTA_FIJA: 'Renda fixa', RENTA_VARIABLE: 'Renda variável', FONDOS: 'Fundos', ACCIONES: 'Ações',
    BIENES_RAICES: 'Imóveis', NEGOCIO: 'Negócio', ACTIVO_DIGITAL: 'Ativo digital', ALTO_RIESGO: 'Alto risco', LIQUIDEZ: 'Liquidez',
  },
  HORIZONS: { CORTO: 'Curto prazo', MEDIANO: 'Médio prazo', LARGO: 'Longo prazo' },
  LIQUIDITY_LEVELS: { ALTA: 'Alta', MEDIA: 'Média', BAJA: 'Baixa' },
  PERCEIVED_RISK: { BAJO: 'Baixo', MEDIO: 'Médio', ALTO: 'Alto', MUY_ALTO: 'Muito alto' },
  RISK_TOLERANCE: { CONSERVADOR: 'Conservador', MODERADO: 'Moderado', ALTO: 'Alto' },
  FINANCIAL_GOALS: { CONSTRUIR_PATRIMONIO: 'Construir patrimônio', FONDO_EMERGENCIA: 'Criar um fundo de emergência', INVERTIR_MEJOR: 'Investir melhor', REDUCIR_DEUDAS: 'Reduzir dívidas', OTRO: 'Outro: escrever minha meta…' },
  AUTOMATION_LEVELS: { MANUAL: 'Manual', SEMI: 'Semiautomatizado', AUTO: 'Automatizado' },
  MONITORING_LEVELS: { BASIC: 'Básico', CONTINUOUS: 'Contínuo', ALERTS: 'Contínuo + alertas' },
  MODULE_STATE: {
    COMPLETED: 'Concluído', AVAILABLE: 'Disponível', LOCKED_ORDER: 'Conclua o módulo anterior', LOCKED_ACCESS: 'Requer acesso',
    LOCKED_FILTER: 'Requer o filtro de mercados', LOCKED_ROUTE: 'Escolha a Rota de Mercados', COMING_SOON: 'Próxima etapa',
  },
  BUDGET_EXTRA: { FLUJO_DISPONIBLE: 'Fluxo disponível', AHORRO: 'Poupança', INVERSION: 'Investimento' },
  DEBT_TYPES: {
    TARJETA_CREDITO: 'Cartão de crédito', PRESTAMO_PERSONAL: 'Empréstimo pessoal', CREDITO_AUTOMOTRIZ: 'Financiamento de veículo',
    HIPOTECA: 'Financiamento imobiliário', CREDITO_NOMINA: 'Crédito consignado', PRESTAMO_FAMILIAR: 'Empréstimo familiar', BNPL: 'Parcelamentos / BNPL',
    DEUDA_NEGOCIO: 'Dívida do negócio', IMPUESTOS: 'Impostos pendentes', OTRA: 'Outra obrigação',
  },
  TAX_ITEM_TYPES: {
    NEGOCIO: 'Negócio', INVERSION_FINANCIERA: 'Investimento financeiro', BIEN_INMUEBLE: 'Imóvel', RENTA_ACTIVOS: 'Aluguel de ativos',
    PARTICIPACION_EMPRESA: 'Participação em empresa', CRIPTOACTIVOS: 'Criptoativos', OTRA: 'Outro investimento',
  },
  RESULT_PERIODS: { MENSUAL: 'Mensal', TRIMESTRAL: 'Trimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual', PERSONALIZADO: 'Personalizado' },
  SCENARIO_TYPES: { AHORRO: 'Poupança', INVERSION: 'Investimento', META: 'Meta financeira', EFECTIVO: 'Dinheiro em espécie', OTRO: 'Outro' },
  ESSENTIAL_SOURCES: { MOVEMENTS: 'Registros reais de receitas e despesas', BUDGET: 'Orçamento planejado do Módulo 7', DECLARED: 'Valor que você declarou', NONE: 'Sem informação' },
  BLOCK_TITLES: { 1: 'Fundamentos, investimento e risco', 2: 'Organização e crescimento patrimonial' },
};

let currentLang = 'es';

export function applyLabels(lang) {
  const next = lang === 'en' || lang === 'pt' ? lang : 'es';
  if (next === currentLang) return;
  currentLang = next;
  const dict = { en: EN, pt: PT }[next] || ES;
  Object.entries(MAPS).forEach(([name, map]) => Object.assign(map, dict[name]));
  APPOINTMENT_REASONS.splice(0, APPOINTMENT_REASONS.length, ...dict.APPOINTMENT_REASONS);
  Object.entries(dict.MODULE_STATE).forEach(([key, label]) => { MODULE_STATE[key].label = label; });
  Object.assign(BUDGET_LABELS, EXPENSE_CATEGORIES, dict.BUDGET_EXTRA);
  Object.entries(OPTION_SOURCES).forEach(([key, map]) => { options[key] = toOptions(map); });
}
