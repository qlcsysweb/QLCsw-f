const fmt = (n) => Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });

export const NOTICE_FLAG = 'edu_login_notice';

export const flagNotice = () => {
  try {
    sessionStorage.setItem(NOTICE_FLAG, '1');
  } catch {
    return;
  }
};

export const NOTICE_TEXT = {
  es: {
    title: 'QLC Quantitative Trading Bot | Una oportunidad para diversificar su portafolio',
    intro: (m) => `Estimado inversor: nuestro producto principal, QLC Quantitative Trading Bot, registra actualmente un retorno sobre inversión (ROI) del ${fmt(m.returnPct)}% en ${fmt(m.days)} días, con ${fmt(m.wins)} operaciones ganadas, ${fmt(m.losses)} perdidas y una tasa de aciertos del ${fmt(m.hitRate)}%. El drawdown máximo registrado es del ${fmt(m.drawdown)}%.`,
    evaluate: 'Evalúe nuestras métricas, analice el riesgo frente al resultado y descubra si QLC Quantitative Trading Bot es una opción para complementar su portafolio de inversión.',
    live: 'Consulte nuestras operaciones en vivo en nuestro perfil Trader Elite de tu exchange o solicite información para acceder a nuestro producto.',
    disclaimer: 'Los resultados pasados no garantizan resultados futuros. Invertir implica riesgos, incluida la pérdida de capital.',
    metrics: (m) => [
      ['Retorno sobre inversión (ROI)', `${fmt(m.returnPct)}%`, `${fmt(m.days)} días`],
      ['Operaciones ganadas', fmt(m.wins), `${fmt(m.losses)} perdidas`],
      ['Tasa de aciertos', `${fmt(m.hitRate)}%`, 'Operaciones cerradas'],
      ['Drawdown máximo', `${fmt(m.drawdown)}%`, 'Registrado'],
    ],
    bitget: 'Ver perfil en tu exchange ↗',
    info: 'Solicitar información ↗',
    close: 'Cerrar',
  },
  en: {
    title: 'QLC Quantitative Trading Bot | An opportunity to diversify your portfolio',
    intro: (m) => `Dear investor: our main product, QLC Quantitative Trading Bot, currently records a return on investment (ROI) of ${fmt(m.returnPct)}% over ${fmt(m.days)} days, with ${fmt(m.wins)} winning trades, ${fmt(m.losses)} losing trades and a ${fmt(m.hitRate)}% hit rate. The maximum recorded drawdown is ${fmt(m.drawdown)}%.`,
    evaluate: 'Review our metrics, weigh the risk against the result and find out whether QLC Quantitative Trading Bot is an option to complement your investment portfolio.',
    live: 'See our live trades on our Elite Trader profile on your exchange or request information to access our product.',
    disclaimer: 'Past results do not guarantee future results. Investing involves risk, including the loss of capital.',
    metrics: (m) => [
      ['Return on investment (ROI)', `${fmt(m.returnPct)}%`, `${fmt(m.days)} days`],
      ['Winning trades', fmt(m.wins), `${fmt(m.losses)} losing`],
      ['Hit rate', `${fmt(m.hitRate)}%`, 'Closed trades'],
      ['Maximum drawdown', `${fmt(m.drawdown)}%`, 'Recorded'],
    ],
    bitget: 'View profile on your exchange ↗',
    info: 'Request information ↗',
    close: 'Close',
  },
  pt: {
    title: 'QLC Quantitative Trading Bot | Uma oportunidade para diversificar sua carteira',
    intro: (m) => `Prezado investidor: nosso produto principal, o QLC Quantitative Trading Bot, registra atualmente um retorno sobre o investimento (ROI) de ${fmt(m.returnPct)}% em ${fmt(m.days)} dias, com ${fmt(m.wins)} operações vencedoras, ${fmt(m.losses)} perdedoras e uma taxa de acerto de ${fmt(m.hitRate)}%. O drawdown máximo registrado é de ${fmt(m.drawdown)}%.`,
    evaluate: 'Avalie nossas métricas, analise o risco em relação ao resultado e descubra se o QLC Quantitative Trading Bot é uma opção para complementar sua carteira de investimentos.',
    live: 'Confira nossas operações ao vivo no nosso perfil Trader Elite da sua exchange ou solicite informações para acessar nosso produto.',
    disclaimer: 'Resultados passados não garantem resultados futuros. Investir envolve riscos, incluindo a perda de capital.',
    metrics: (m) => [
      ['Retorno sobre o investimento (ROI)', `${fmt(m.returnPct)}%`, `${fmt(m.days)} dias`],
      ['Operações vencedoras', fmt(m.wins), `${fmt(m.losses)} perdedoras`],
      ['Taxa de acerto', `${fmt(m.hitRate)}%`, 'Operações fechadas'],
      ['Drawdown máximo', `${fmt(m.drawdown)}%`, 'Registrado'],
    ],
    bitget: 'Ver perfil na sua exchange ↗',
    info: 'Solicitar informações ↗',
    close: 'Fechar',
  },
};
