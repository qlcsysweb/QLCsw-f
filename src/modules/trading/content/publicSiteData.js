/*
 * DATOS DE LA PÁGINA PÚBLICA PREDEFINIDOS EN EL CÓDIGO — la página pública no
 * consulta el backend ni NeonDB (0 consultas). Generado el 2026-10-24 con lo
 * vigente en la base (respaldo: .qlc-backups/sitio_publico_antes_2026-10-24.json).
 *
 * TEXTOS (se editan aquí y se despliega): preguntas frecuentes, modelo de
 * participación y "Resultados" (título/descripción del perfil de Bitget).
 * La nota de advertencia del modelo está en publicContent.js → modelos.note.
 *
 * DATOS QUE EL ADMIN SÍ ACTUALIZA (cifras/enlace del perfil de Bitget, logos
 * ES/EN, multimedia, reparto del Affiliate Program): el backend los publica
 * en Cloudinary como site-data.json (ver backend/src/services/publicSiteSnapshot.js)
 * y el sitio los lee del CDN. SITE_DATA_DEFAULTS es su respaldo si el CDN falla.
 */

export const SITE_DATA_URL =
  import.meta.env.VITE_SITE_DATA_URL || "https://res.cloudinary.com/j90ujkhz/raw/upload/qlc/public/site-data.json";

export const FAQS = [
  {
    "id": "cmtswub8h00057kqgb64tpd0e",
    "question": "¿Qué es QLC?",
    "questionEn": "What is QLC?",
    "questionPt": "O que é a QLC?",
    "answer": "QLC es una estrategia de bot trading institucional: un bot ejecuta la estrategia directamente sobre la cuenta del cliente mediante tecnología propia y conexión API.",
    "answerEn": "QLC is an institutional bot trading strategy: a bot executes the strategy directly on the client's account through proprietary technology and an API connection.",
    "answerPt": "A QLC é uma estratégia de bot trading institucional: um bot executa a estratégia diretamente na conta do cliente por meio de tecnologia própria e conexão API."
  },
  {
    "id": "cmtswub8i00067kqg4ke9jd1k",
    "question": "¿Dónde permanece mi capital?",
    "questionEn": "Where does my capital stay?",
    "questionPt": "Onde meu capital permanece?",
    "answer": "El capital permanece en la cuenta del cliente en el exchange. QLC no necesita recibir los fondos para ejecutar la estrategia.",
    "answerEn": "Your capital stays in your account on the exchange. QLC does not need to receive the funds to execute the strategy.",
    "answerPt": "O capital permanece na conta do cliente na exchange. A QLC não precisa receber os fundos para executar a estratégia."
  },
  {
    "id": "cmtvvh1ya00007k204738x9eu",
    "question": "¿Cómo funciona el incremento de mi capital dentro del modelo QLC?",
    "questionEn": "How does the growth of my capital work within the QLC model?",
    "questionPt": "Como funciona o aumento do meu capital dentro do modelo QLC?",
    "answer": "El acceso se gana. La confianza también.\n\nQLC no recibe capital de inversión. El capital permanece siempre en la cuenta del cliente.\n\nLos incrementos de saldo dentro del modelo se habilitan únicamente por invitación, conforme se desarrolla una relación de confianza entre el cliente y QLC, considerando el cumplimiento oportuno de sus pagos y la correcta ejecución de nuestra estrategia.\n\nMás confianza. Mayor capacidad de participación.",
    "answerEn": "Access is earned. So is trust.\n\nQLC does not take in investment capital. The capital always remains in the client's account.\n\nIncreases in the account balance within the model are available by invitation only, as a relationship of trust develops between the client and QLC—based on timely payments and the successful execution of our strategy.\n\nGreater trust. Greater participation capacity.",
    "answerPt": "O acesso se conquista. A confiança também.\n\nA QLC não recebe capital de investimento. O capital permanece sempre na conta do cliente.\n\nOs aumentos de saldo dentro do modelo são habilitados apenas por convite, à medida que se desenvolve uma relação de confiança entre o cliente e a QLC, considerando o cumprimento pontual de seus pagamentos e a correta execução da nossa estratégia.\n\nMais confiança. Maior capacidade de participação."
  },
  {
    "id": "cmtswub8i00077kqg6j3atyj6",
    "question": "¿Cómo se conecta mi cuenta?",
    "questionEn": "How does my account connect?",
    "questionPt": "Como minha conta é conectada?",
    "answer": "El cliente autoriza una conexión API con permisos limitados. Esa conexión permite a QLC ejecutar operaciones, sin autorización para retirar fondos.",
    "answerEn": "The client authorizes an API connection with limited permissions. That connection allows QLC to execute operations, without authorization to withdraw funds.",
    "answerPt": "O cliente autoriza uma conexão API com permissões limitadas. Essa conexão permite que a QLC execute operações, sem autorização para sacar fundos."
  },
  {
    "id": "cmtswub8i00087kqghg2ey9mp",
    "question": "¿Qué tamaño de cuenta está contemplado?",
    "questionEn": "What account size is supported?",
    "questionPt": "Qual tamanho de conta é contemplado?",
    "answer": "La arquitectura comercial de QLC está diseñada para operar con cuentas individuales desde 100 USDT hasta 2,000 USDT.",
    "answerEn": "QLC's commercial architecture is designed to operate with individual accounts ranging from 100 USDT to 2,000 USDT.",
    "answerPt": "A arquitetura comercial da QLC foi desenhada para operar com contas individuais de 100 USDT até 2.000 USDT."
  },
  {
    "id": "cmtswub8i00097kqguhprl26x",
    "question": "¿QLC utiliza el copytrading nativo del exchange?",
    "questionEn": "Does QLC use the exchange's native copytrading?",
    "questionPt": "A QLC usa o copytrading nativo da exchange?",
    "answer": "No. El modelo se basa en infraestructura propia y en una conexión API directa con la cuenta autorizada del cliente.",
    "answerEn": "No. The model is based on proprietary infrastructure and a direct API connection with the client's authorized account.",
    "answerPt": "Não. O modelo se baseia em infraestrutura própria e em uma conexão API direta com a conta autorizada do cliente."
  },
  {
    "id": "cmu4dg5l400001iz0722oatqv",
    "question": "¿Cómo funciona el depósito en garantía?",
    "questionEn": "How does the guarantee deposit work?",
    "questionPt": "Como funciona o depósito em garantia?",
    "answer": "El depósito en garantía es el importe que el cliente paga por adelantado para establecer el periodo de servicio.\n\nLa particularidad del modelo QLC es que la rentabilidad se genera directamente dentro de la cuenta del cliente en el exchange. Por esta razón, el depósito en garantía funciona como referencia y garantía de que los servicios de QLC podrán ser pagados con la rentabilidad que se genere en la propia cuenta del cliente.\n\nEJEMPLO SENCILLO\n\nSupongamos que el cliente realiza un depósito en garantía de 20 USDT.\n\nInicio del periodo\n↓\nEl cliente deposita 20 USDT en garantía\n↓\nQLC ejecuta la estrategia en la cuenta del cliente\n↓\nLa rentabilidad se genera directamente en la cuenta del cliente\n↓\nCuando la rentabilidad acumulada alcanza 20 USDT\n↓\nSe alcanza el importe equivalente al depósito en garantía\n↓\nSe realiza el corte del periodo y se genera el estado de cuenta\n\nEs decir, los 20 USDT de depósito en garantía no representan una rentabilidad que QLC tenga que generar fuera de la cuenta del cliente. El objetivo es que la propia cuenta del cliente genere una rentabilidad equivalente a esos 20 USDT.\n\n¿QUÉ SUCEDE DESPUÉS?\n\nUna vez realizado el corte, el cliente puede decidir libremente si desea continuar con el servicio.\n\nSI DESEA RENOVAR:\n\nSe genera y se entrega el estado de cuenta correspondiente al periodo anterior.\n\nDespués, para iniciar un nuevo periodo, el cliente vuelve a completar su depósito en garantía y comienza un nuevo ciclo bajo las mismas condiciones.\n\nSI NO DESEA CONTINUAR:\n\nSimplemente no realiza un nuevo depósito en garantía.\n\nNo existe obligación de renovar, ya que el servicio correspondiente al periodo anterior ya fue pagado por adelantado mediante el depósito en garantía y ese periodo ya quedó concluido con su respectivo corte.\n\nEN POCAS PALABRAS:\n\nDepósito en garantía\n→ generación de rentabilidad en la cuenta del cliente\n→ se alcanza el equivalente al depósito\n→ corte y estado de cuenta\n→ decisión de renovar o no.\n\nSi el cliente renueva, completa nuevamente el depósito en garantía y comienza un nuevo ciclo.\n\nSi no desea continuar, no deposita nuevamente y simplemente finaliza su participación.",
    "answerEn": "The guarantee deposit is the amount the client pays in advance to establish the service period.\n\nThe distinctive feature of the QLC model is that returns are generated directly inside the client's own exchange account. For this reason, the guarantee deposit acts as a reference and guarantee that QLC's services can be paid from the returns generated in the client's own account.\n\nSIMPLE EXAMPLE\n\nSuppose the client makes a 20 USDT guarantee deposit.\n\nStart of the period\n↓\nThe client deposits 20 USDT as a guarantee\n↓\nQLC executes the strategy on the client's account\n↓\nReturns are generated directly in the client's account\n↓\nWhen accumulated returns reach 20 USDT\n↓\nThe amount equivalent to the guarantee deposit is reached\n↓\nThe period is closed out and the statement is generated\n\nIn other words, the 20 USDT guarantee deposit does not represent a return that QLC has to generate outside the client's account. The goal is for the client's own account to generate a return equivalent to those 20 USDT.\n\nWHAT HAPPENS NEXT?\n\nOnce the period is closed out, the client is free to decide whether to continue with the service.\n\nIF THEY WANT TO RENEW:\n\nThe statement corresponding to the previous period is generated and delivered.\n\nThen, to start a new period, the client completes the guarantee deposit again and begins a new cycle under the same conditions.\n\nIF THEY DO NOT WANT TO CONTINUE:\n\nThey simply do not make a new guarantee deposit.\n\nThere is no obligation to renew, since the service for the previous period was already paid in advance through the guarantee deposit, and that period has already concluded with its corresponding close-out.\n\nIN SHORT:\n\nGuarantee deposit\n→ returns generated in the client's account\n→ the equivalent of the deposit is reached\n→ close-out and statement\n→ decision to renew or not.\n\nIf the client renews, they complete the guarantee deposit again and start a new cycle.\n\nIf they do not wish to continue, they do not deposit again and simply end their participation.",
    "answerPt": "O depósito em garantia é o valor que o cliente paga antecipadamente para estabelecer o período de serviço.\n\nA particularidade do modelo QLC é que a rentabilidade é gerada diretamente dentro da conta do cliente na exchange. Por isso, o depósito em garantia funciona como referência e garantia de que os serviços da QLC poderão ser pagos com a rentabilidade gerada na própria conta do cliente.\n\nEXEMPLO SIMPLES\n\nSuponha que o cliente faça um depósito em garantia de 20 USDT.\n\nInício do período\n↓\nO cliente deposita 20 USDT em garantia\n↓\nA QLC executa a estratégia na conta do cliente\n↓\nA rentabilidade é gerada diretamente na conta do cliente\n↓\nQuando a rentabilidade acumulada chega a 20 USDT\n↓\nAtinge-se o valor equivalente ao depósito em garantia\n↓\nFaz-se o fechamento do período e gera-se o extrato\n\nOu seja, os 20 USDT de depósito em garantia não representam uma rentabilidade que a QLC precise gerar fora da conta do cliente. O objetivo é que a própria conta do cliente gere uma rentabilidade equivalente a esses 20 USDT.\n\nO QUE ACONTECE DEPOIS?\n\nFeito o fechamento, o cliente pode decidir livremente se deseja continuar com o serviço.\n\nSE DESEJAR RENOVAR:\n\nÉ gerado e entregue o extrato correspondente ao período anterior.\n\nDepois, para iniciar um novo período, o cliente volta a completar seu depósito em garantia e começa um novo ciclo nas mesmas condições.\n\nSE NÃO DESEJAR CONTINUAR:\n\nSimplesmente não faz um novo depósito em garantia.\n\nNão existe obrigação de renovar, pois o serviço correspondente ao período anterior já foi pago antecipadamente por meio do depósito em garantia e esse período já foi concluído com o respectivo fechamento.\n\nEM POUCAS PALAVRAS:\n\nDepósito em garantia\n→ geração de rentabilidade na conta do cliente\n→ atinge-se o equivalente ao depósito\n→ fechamento e extrato\n→ decisão de renovar ou não.\n\nSe o cliente renova, completa novamente o depósito em garantia e começa um novo ciclo.\n\nSe não deseja continuar, não deposita novamente e simplesmente encerra sua participação."
  }
];

export const MODELS = [
  {
    "id": "cmtswub3g00037kqgu10ew01q",
    "key": "PERFORMANCE",
    "name": "Modelo de participación",
    "nameEn": "Participation model",
    "namePt": "Modelo de participação",
    "tagline": "Ganamos juntos",
    "taglineEn": "We win together",
    "taglinePt": "Ganhamos juntos",
    "description": "El modelo de participación está diseñado para que la remuneración de QLC esté directamente relacionada con el resultado generado. QLC participa únicamente de la ganancia efectivamente generada durante el período — no se aplica el porcentaje sobre el capital inicial.",
    "descriptionEn": "The participation model is designed so that QLC's compensation is directly tied to the result generated. QLC only participates in the profit effectively generated during the period — the percentage is never applied to the initial capital.",
    "descriptionPt": "O modelo de participação foi desenhado para que a remuneração da QLC esteja diretamente relacionada ao resultado gerado. A QLC participa apenas do lucro efetivamente gerado durante o período — a porcentagem não é aplicada sobre o capital inicial.",
    "conditions": "QLC: 50% · Cliente: 50%",
    "conditionsEn": "QLC: 50% · Client: 50%",
    "conditionsPt": "QLC: 50% · Cliente: 50%",
    "period": null,
    "periodEn": null,
    "percentage": "50/50",
    "objective": null,
    "detailsContent": "¿Cómo funciona?\nLa distribución 50/50 se aplica exclusivamente sobre la utilidad efectivamente generada, nunca sobre el capital aportado.\n\nEjemplo — Capital de 100 USDT\nGanancia generada: 20 USDT → QLC recibe 10 USDT (50%) · Cliente recibe 10 USDT (50%) → Capital final: 110 USDT\nGanancia generada: 1 USDT → QLC recibe 0.50 USDT · Cliente recibe 0.50 USDT → Capital final: 100.50 USDT\n\nSi se generan 0 USDT, QLC recibe 0 USDT.\n\nCaracterísticas principales\n• Sin cobros sobre el capital: el porcentaje se calcula sobre la ganancia.\n• Pago únicamente sobre resultados efectivamente generados.\n• Modelo totalmente proporcional al desempeño.\n• La remuneración de QLC está directamente vinculada al resultado real obtenido.\n\n¿Para quién está pensado?\n\"No quiero que QLC cobre sobre mi capital. Prefiero que su participación dependa directamente de las ganancias que realmente genere.\"",
    "detailsContentEn": "How does it work?\nThe 50/50 split applies exclusively to the profit effectively generated, never to the capital contributed.\n\nExample — 100 USDT capital\nProfit generated: 20 USDT → QLC receives 10 USDT (50%) · Client receives 10 USDT (50%) → Final capital: 110 USDT\nProfit generated: 1 USDT → QLC receives 0.50 USDT · Client receives 0.50 USDT → Final capital: 100.50 USDT\n\nIf 0 USDT is generated, QLC receives 0 USDT.\n\nMain characteristics\n• No charges on capital: the percentage is calculated on the profit.\n• Payment only on results effectively generated.\n• Fully performance-proportional model.\n• QLC's compensation is directly tied to the actual result obtained.\n\nWho is it designed for?\n\"I don't want QLC to charge on my capital. I prefer its participation to depend directly on the profits it actually generates.\"",
    "detailsContentPt": "Como funciona?\nA distribuição 50/50 é aplicada exclusivamente sobre o lucro efetivamente gerado, nunca sobre o capital aportado.\n\nExemplo — Capital de 100 USDT\nLucro gerado: 20 USDT → a QLC recebe 10 USDT (50%) · o Cliente recebe 10 USDT (50%) → Capital final: 110 USDT\nLucro gerado: 1 USDT → a QLC recebe 0,50 USDT · o Cliente recebe 0,50 USDT → Capital final: 100,50 USDT\n\nSe forem gerados 0 USDT, a QLC recebe 0 USDT.\n\nCaracterísticas principais\n• Sem cobranças sobre o capital: a porcentagem é calculada sobre o lucro.\n• Pagamento apenas sobre resultados efetivamente gerados.\n• Modelo totalmente proporcional ao desempenho.\n• A remuneração da QLC está diretamente vinculada ao resultado real obtido.\n\nPara quem foi pensado?\n\"Não quero que a QLC cobre sobre o meu capital. Prefiro que a participação dela dependa diretamente dos lucros que realmente gerar.\"",
    "isActive": true,
    "displayOrder": 1
  }
];

export const TRACK_RECORD_TEXT = {
  "title": "Una referencia externa y verificable.",
  "titleEn": "An external, verifiable reference.",
  "titlePt": "Uma referência externa e verificável.",
  "description": "Los indicadores de rendimiento pueden consultarse directamente en Bitget, incluyendo el ROI desde 30 días hasta 180 días y la tasa de éxito. Son datos históricos de carácter informativo y no constituyen una garantía de resultados futuros.",
  "descriptionEn": "Performance indicators can be reviewed directly on Bitget, including the ROI from 30 days up to 180 days and the win rate. They are historical, informational data and do not constitute a guarantee of future results.",
  "descriptionPt": "Os indicadores de rendimento podem ser consultados diretamente na Bitget, incluindo o ROI de 30 a 180 dias e a taxa de acerto. São dados históricos de caráter informativo e não constituem uma garantia de resultados futuros."
};

export const SITE_DATA_DEFAULTS = {
  "version": 1,
  "trackRecord": {
    "platformName": "Bitget",
    "profileLink": "https://share.glassgs.com/sl/4W24Q3JAVV0K",
    "ranking": "#XXX",
    "roi30d": 16.56,
    "roiDays": 180,
    "winRate": 100,
    "maxDrawdown": 17.76
  },
  "logos": {
    "es": {
      "image": null,
      "video": {
        "type": "VIDEO",
        "url": "https://res.cloudinary.com/j90ujkhz/video/upload/v1788970174/qlc/branding/z8ncjzu6vqvnbrfk8960.mp4"
      }
    },
    "en": {
      "image": null,
      "video": null
    }
  },
  "sectionMedia": {},
  "distribution": {
    "current": {
      "client": 50,
      "qlc": 40,
      "affiliate": 10
    },
    "scheduled": []
  }
};
