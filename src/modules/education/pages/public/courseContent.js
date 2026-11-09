const ES = [
  {
    id: '01',
    title: '¿Qué significa realmente invertir?',
    intro: 'Invertir significa colocar capital en un activo, instrumento, proyecto o estrategia esperando obtener un beneficio futuro. Ese beneficio puede venir de intereses, dividendos, crecimiento del precio, renta, flujo de efectivo o resultado de una actividad empresarial.',
    blocks: [
      {
        type: 'cards', cols: 3, numbered: true,
        items: [
          ['Rendimiento', 'Es el resultado obtenido por el capital durante un periodo. Puede expresarse en dinero o en porcentaje. Un rendimiento positivo no significa necesariamente que la inversión haya sido adecuada: siempre debe compararse con el riesgo asumido.'],
          ['Riesgo', 'Es la posibilidad de que el resultado sea diferente al esperado, incluida la pérdida parcial o total del capital. Cuanto más incierto es el resultado, mayor atención requiere la gestión de la exposición.'],
          ['Horizonte', 'Es el tiempo durante el cual planeas mantener la inversión. Un objetivo de largo plazo puede tolerar fluctuaciones diferentes a una necesidad de liquidez inmediata.'],
        ],
      },
      {
        type: 'lesson',
        title: 'La primera regla: invertir no debe reemplazar inmediatamente tu fuente de ingresos',
        paragraphs: [
          'Para la mayoría de las personas, las inversiones deberían comenzar como una **segunda fuente de ingresos y de crecimiento patrimonial**, no como el dinero del que dependen para pagar sus gastos diarios.',
          'Existe una diferencia enorme entre **construir patrimonio** y buscar “hacerte millonario de la noche a la mañana”. La segunda idea suele empujar a las personas hacia concentraciones excesivas, apalancamiento y decisiones impulsivas. La primera se construye con tiempo, aportaciones, disciplina, reinversión y una adecuada administración del riesgo.',
          '¿Se puede llegar a vivir de las inversiones? Sí. Pero normalmente el objetivo se construye cuando el patrimonio invertido alcanza un tamaño suficiente para generar ingresos que cubran de manera sostenible los gastos de la persona. **No se empieza dejando de trabajar; se empieza construyendo un patrimonio que algún día pueda permitirlo.**',
        ],
        example: ['Ejemplo educativo:', 'imagina que tus gastos mensuales son 2,000 unidades monetarias. Si tus inversiones todavía generan resultados pequeños o variables, abandonar tu fuente principal de ingresos para depender de ellas aumenta innecesariamente la presión sobre tu capital. Una estructura más prudente es mantener tu actividad productiva mientras construyes progresivamente el patrimonio invertido.'],
      },
      {
        type: 'lesson',
        title: 'Antes de invertir: protege primero lo que puede destruir tu patrimonio',
        paragraphs: [
          'Una educación financiera completa no empieza hablando de rentabilidad. Empieza hablando de **protección**. Antes de destinar una parte importante del patrimonio a inversiones, conviene considerar cómo enfrentarías acontecimientos que pueden generar gastos extraordinarios.',
          'Entre esas protecciones están los **seguros de gastos médicos mayores** y los **seguros de vida**, especialmente cuando existen dependientes económicos. En países donde la atención pública puede ser insuficiente, limitada o generar largos tiempos de espera, una cobertura médica adecuada puede tener una función patrimonial fundamental.',
          'La lógica es sencilla: no tendría mucho sentido perseguir un rendimiento adicional mientras una emergencia médica, un accidente o el fallecimiento de la persona que genera los ingresos pudiera obligar a liquidar inversiones o endeudarse.',
        ],
        example: ['Orden conceptual:', 'primero proteger la capacidad de generar ingresos y enfrentar contingencias; después construir liquidez; posteriormente desarrollar inversiones de acuerdo con los objetivos y el riesgo que puedas asumir.'],
      },
      {
        type: 'lesson',
        title: 'Patrimonio por capas',
        paragraphs: ['Una forma sencilla de entenderlo es pensar en tu patrimonio como una estructura de varias capas:'],
        list: [
          '**Protección:** seguros y mecanismos para enfrentar eventos que podrían afectar gravemente a la familia o al patrimonio.',
          '**Liquidez:** dinero disponible para emergencias, necesidades y oportunidades.',
          '**Actividad productiva:** empleo, profesión o negocio que genera el ingreso principal.',
          '**Inversiones:** capital destinado al crecimiento y generación de ingresos complementarios.',
          '**Alto riesgo:** una porción limitada destinada a oportunidades con mayor volatilidad y posibilidad de pérdidas.',
        ],
        after: ['El objetivo no es que todas las capas tengan el mismo tamaño. El objetivo es que una sola inversión de alto riesgo no pueda poner en peligro toda la estructura.'],
      },
      {
        type: 'lesson',
        title: 'Cómo analizar cualquier inversión',
        list: [
          '**¿Qué estoy comprando?** Entiende el activo o estrategia.',
          '**¿De dónde proviene el posible rendimiento?** Intereses, dividendos, apreciación, renta, operación empresarial, etc.',
          '**¿Qué puede hacerme perder dinero?** Identifica los riesgos específicos.',
          '**¿Cuándo puedo necesitar el dinero?** Relaciona la inversión con tu horizonte.',
          '**¿Qué porcentaje de mi patrimonio representa?** Esta pregunta introduce la diversificación.',
        ],
      },
    ],
  },
  {
    id: '02',
    title: 'Riesgo y rendimiento: por qué nadie puede eliminar el riesgo',
    intro: 'Una de las ideas más importantes de las finanzas es que el rendimiento potencial y el riesgo deben analizarse juntos. Buscar un rendimiento mayor normalmente implica aceptar alguna combinación de mayor incertidumbre, volatilidad, plazo o complejidad.',
    blocks: [
      {
        type: 'cards', cols: 2,
        items: [
          ['Riesgo de mercado', 'El precio de un activo puede subir o bajar por cambios en oferta y demanda, tasas, liquidez, expectativas, noticias o condiciones macroeconómicas.'],
          ['Riesgo de liquidez', 'Una inversión puede tener valor, pero no ser fácil de vender al precio deseado. La liquidez importa especialmente cuando el dinero puede necesitarse con rapidez.'],
          ['Riesgo operativo', 'Incluye errores de ejecución, infraestructura, tecnología, procesos, contraparte o fallas en la operación de una estrategia.'],
          ['Riesgo de apalancamiento', 'El apalancamiento permite controlar una exposición mayor utilizando menos margen, pero también puede amplificar las consecuencias de un movimiento adverso.'],
        ],
      },
      {
        type: 'lesson',
        title: 'Volatilidad no significa automáticamente pérdida',
        paragraphs: ['La volatilidad describe cuánto puede cambiar el precio. Un activo muy volátil puede subir rápidamente y también caer rápidamente. Por eso una persona no debería mirar solamente el rendimiento histórico; debe observar cómo se consiguió, qué exposición existía y qué podría ocurrir bajo condiciones diferentes.'],
        example: ['Ejemplo:', 'dos estrategias pueden mostrar el mismo rendimiento en un periodo. Una pudo conseguirlo con fluctuaciones moderadas y otra mediante posiciones muy apalancadas. El número final es igual, pero el perfil de riesgo es completamente distinto.'],
      },
      { type: 'risk', label: 'Regla de oro:', text: 'el desempeño histórico no elimina el riesgo de mercado. En el caso de activos digitales y trading apalancado, las pérdidas pueden ser significativas y ningún resultado pasado garantiza resultados futuros.' },
    ],
  },
  {
    id: '03',
    title: 'Diversificación: no pongas todos los huevos en una sola canasta',
    intro: 'Diversificar significa distribuir el capital entre diferentes activos, estrategias, sectores, fuentes de ingreso y, cuando sea apropiado, horizontes. La finalidad no es evitar cualquier pérdida; es evitar que un único evento determine el resultado de todo el patrimonio.',
    blocks: [
      {
        type: 'cards', cols: 3,
        items: [
          ['Reserva de liquidez', 'Capital disponible para necesidades, contingencias y oportunidades. Su función es dar estabilidad y evitar vender inversiones en un momento desfavorable por una necesidad inesperada.'],
          ['Renta fija', 'Instrumentos que pueden aportar estabilidad relativa y flujos definidos, aunque tienen riesgos propios como tasas, inflación, emisor y liquidez.'],
          ['Renta variable', 'Acciones, fondos y otros instrumentos cuyo valor puede fluctuar. Su función dentro de un portafolio puede estar relacionada con crecimiento patrimonial.'],
          ['Activos digitales', 'Una exposición específica a un mercado de elevada volatilidad y con riesgos particulares.'],
          ['Estrategias especializadas', 'Capital asignado a metodologías concretas de inversión o trading, con parámetros de riesgo y operación definidos.'],
          ['Negocios físicos', 'Empresas o actividades productivas que pueden generar flujo de efectivo y ofrecer una fuente de retorno diferente a los mercados financieros.'],
        ],
      },
      {
        type: 'lesson',
        title: 'Diversificar no significa comprar muchas cosas',
        paragraphs: [
          'Comprar diez activos que se comportan prácticamente igual no crea necesariamente una buena diversificación. La pregunta importante es **qué tan relacionados están los riesgos**. Un portafolio puede tener muchas posiciones y seguir dependiendo demasiado de un mismo mercado o factor.',
          'La diversificación también puede producirse entre **fuentes de flujo**. Por ejemplo, una persona puede combinar ingresos laborales o empresariales, instrumentos financieros y una asignación pequeña a estrategias de mayor riesgo.',
        ],
      },
      {
        type: 'lesson',
        title: '¿Por qué incluir un negocio físico?',
        paragraphs: [
          'Los mercados financieros no son la única manera de construir patrimonio. Un **negocio físico** puede aportar una fuente de flujo de efectivo vinculada a una actividad productiva: comercio, servicios, alimentos, manufactura, renta de espacios u otras actividades empresariales.',
          'Esto no significa que un negocio sea automáticamente seguro. También tiene riesgos: gastos, competencia, personal, demanda, inventario, impuestos, mantenimiento y capital inmovilizado. Precisamente por eso se considera otra pieza de la diversificación, no un sustituto de todas las demás inversiones.',
          'La idea es construir diferentes motores económicos. Mientras una actividad profesional o empresarial puede producir flujo de efectivo, un portafolio financiera puede buscar crecimiento o ingresos a largo plazo, y una pequeña asignación de alto riesgo puede participar en oportunidades de mayor volatilidad.',
        ],
        example: ['Principio:', 'no necesitas que todos tus activos produzcan dinero de la misma manera. La fortaleza puede estar en combinar fuentes que tengan comportamientos y riesgos diferentes.'],
      },
      {
        type: 'lesson',
        title: 'El objetivo final: que el patrimonio llegue a pagar tus gastos',
        paragraphs: [
          'La independencia financiera no consiste simplemente en tener una cuenta grande. Consiste en alcanzar un punto en el que los **ingresos sostenibles producidos por tu patrimonio** sean suficientes para cubrir tus gastos sin depender necesariamente de tu trabajo diario.',
          'Ese punto debe ser el resultado de un proceso. Primero trabajas o construyes una actividad productiva; después ahorras y proteges una parte del capital; luego inviertes; posteriormente reinviertes y haces crecer el patrimonio. Con el tiempo, si el patrimonio alcanza un tamaño suficiente y los ingresos que produce son sostenibles, la dependencia del trabajo puede reducirse.',
          'Por eso abandonar el trabajo demasiado pronto puede ser un error. El trabajo, la profesión o el negocio pueden ser precisamente el motor que financia la construcción del patrimonio que algún día permitirá trabajar por elección y no por necesidad.',
        ],
      },
      { type: 'quote', text: '“QLC no busca administrar todo tu patrimonio. Busca convertirse en una asignación estratégica dentro de él.”', source: 'Principio central del documento conceptual de Educación Financiera de QLC.' },
    ],
  },
  {
    id: '04',
    title: 'Renta fija, renta variable y negocios: tres piezas con funciones distintas',
    intro: 'Un portafolio equilibrado no necesita que todos sus componentes hagan lo mismo. Precisamente su valor está en que cada componente pueda cumplir una función diferente.',
    blocks: [
      {
        type: 'table',
        head: ['Tipo', 'Función posible', 'Ventajas potenciales', 'Riesgos / desventajas'],
        rows: [
          ['Renta fija', 'Estabilidad relativa y generación de flujos', 'Mayor previsibilidad en determinados instrumentos', 'Inflación, tasas, crédito, liquidez y rendimiento limitado'],
          ['Renta variable', 'Crecimiento patrimonial', 'Participación en empresas y potencial de apreciación', 'Volatilidad, caídas de mercado y pérdida de capital'],
          ['Negocios físicos', 'Flujo de efectivo y actividad productiva', 'Ingresos operativos y diversificación fuera de mercados', 'Operación, gastos, demanda, personal, competencia y capital inmovilizado'],
          ['Activos digitales', 'Exposición a un mercado alternativo', 'Acceso a una clase de activos dinámica', 'Alta volatilidad, liquidez variable y riesgos específicos del ecosistema'],
        ],
      },
      {
        type: 'lesson',
        title: 'El portafolio debe responder a tus objetivos',
        paragraphs: [
          'Una persona que necesita liquidez puede priorizar instrumentos diferentes a alguien que tiene un horizonte de muchos años. Del mismo modo, alguien con ingresos empresariales variables puede valorar de forma distinta una reserva de liquidez frente a una persona con ingresos más estables.',
          'Por eso no existe un porcentaje universal que sea “el portafolio correcto” para todo el mundo. Una asignación debe construirse alrededor del objetivo, horizonte, capacidad para asumir pérdidas y necesidad de liquidez.',
        ],
        example: ['Ejemplo conceptual:', 'piensa en un portafolio como una mesa. La liquidez, renta fija, renta variable, negocios y estrategias especializadas son patas diferentes. No todas tienen que ser del mismo tamaño; lo importante es que la estructura completa tenga sentido.'],
      },
    ],
  },
  {
    id: '05',
    title: 'Trading: entender qué es realmente una estrategia de alto riesgo',
    intro: 'El trading busca aprovechar movimientos de precio mediante operaciones de compra, venta o ambas, dependiendo del mercado y de la estrategia. Puede utilizar análisis, datos, gestión de posiciones, automatización y herramientas tecnológicas.',
    blocks: [
      {
        type: 'cards', cols: 3,
        items: [
          ['Análisis', 'El operador estudia precio, liquidez, volatilidad, volumen, derivados, posiciones y otros datos para construir una hipótesis de mercado.'],
          ['Ejecución', 'La entrada y salida importan. En mercados rápidos, la diferencia entre el precio esperado y el ejecutado puede cambiar el resultado.'],
          ['Gestión de riesgo', 'El tamaño de la posición, el margen, la exposición total y las reglas operativas determinan cuánto capital queda comprometido.'],
        ],
      },
      {
        type: 'lesson',
        title: 'Por qué las redes sociales pueden crear una imagen distorsionada',
        paragraphs: [
          'En internet es frecuente mostrar únicamente operaciones ganadoras, capturas de resultados o promesas de rentabilidad. Eso no permite conocer la distribución completa de resultados, el capital expuesto, los periodos negativos ni el riesgo utilizado para conseguirlos.',
          'El trading profesional, en cambio, debe analizarse como un **sistema**: metodología + datos + infraestructura + ejecución + control de exposición + disciplina + evaluación.',
        ],
      },
      {
        type: 'lesson',
        title: 'Retail frente a infraestructura profesional',
        paragraphs: [
          'Muchos operadores minoristas comienzan con herramientas limitadas, toman decisiones emocionales, utilizan un tamaño de posición excesivo o no tienen un proceso consistente. Eso puede colocarlos en desventaja frente a participantes con mejores datos, tecnología, experiencia e infraestructura.',
          'Esto no significa que todo operador retail esté destinado a perder ni que toda operación profesional sea ganadora. Significa que el **proceso y la infraestructura importan**, especialmente cuando se opera un mercado rápido y apalancado.',
        ],
      },
      { type: 'risk', label: 'Conclusión:', text: 'el trading no debe presentarse como una forma sencilla de enriquecimiento. Es una actividad de alto riesgo que requiere entender perfectamente qué capital se está exponiendo y bajo qué reglas.' },
    ],
  },
  {
    id: '06',
    title: '¿Qué lugar puede ocupar QLC dentro de un portafolio?',
    intro: 'El concepto de QLC parte de una idea sencilla: una estrategia especializada de trading puede existir dentro de un portafolio, pero no necesita representar la totalidad del patrimonio.',
    blocks: [
      {
        type: 'cards', cols: 2,
        items: [
          ['Una asignación, no el patrimonio', 'QLC plantea una exposición específica con parámetros definidos. El objetivo conceptual es evitar que el inversor concentre todo su patrimonio en una sola estrategia de alto riesgo.'],
          ['Infraestructura y tecnología', 'El modelo se plantea alrededor de software, automatización, infraestructura operativa y algoritmos para ejecutar una metodología definida.'],
          ['Control de exposición', 'La política inicial de QLC establece límites de capital por cuenta principal como parte de su metodología de distribución y control de exposición.'],
          ['Seguimiento antes de crecer', 'El incremento de una asignación no se plantea como automático. Puede depender de la relación, condiciones operativas, evaluación y capacidad de infraestructura.'],
        ],
      },
      {
        type: 'lesson',
        title: '¿Por qué un límite inicial de 2,000 USDT?',
        paragraphs: [
          'De acuerdo con el documento conceptual de QLC, la asignación inicial contempla un mínimo de **100 USDT** y un máximo de **2,000 USDT** por cuenta principal. La finalidad indicada es mantener el capital administrado dentro de parámetros operativos definidos y evitar una concentración excesiva de capital en una sola cuenta operativa.',
          'La lógica educativa detrás del límite es importante: cuando una inversión es de alto riesgo, aumentar el capital no necesariamente mejora la estructura de un portafolio. Primero debe existir una razón para aumentar la exposición.',
        ],
        example: ['Idea clave:', 'si una persona tiene un patrimonio diversificado, una asignación limitada a una estrategia especializada puede permitir participar en ella sin convertirla automáticamente en el centro de todo su patrimonio.'],
      },
      { type: 'quote', text: '“La gestión profesional también consiste en saber cuándo no aumentar la exposición.”', source: 'Principio incluido en el documento conceptual de QLC.' },
    ],
  },
  {
    id: '07',
    title: 'Cómo construir un portafolio paso a paso',
    intro: 'Ahora reunimos todo lo aprendido. El objetivo no es darte una fórmula universal, sino enseñarte un proceso mental para tomar mejores decisiones.',
    blocks: [
      {
        type: 'timeline',
        steps: [
          ['Calcula tu realidad financiera', 'Identifica patrimonio, deudas, ingresos, gastos, liquidez y capital que realmente puedes invertir. No empieces por elegir un activo; empieza por entender tu situación.'],
          ['Define tus objetivos', 'Determina si buscas preservar capital, generar flujo, crecer a largo plazo o asumir una exposición específica a oportunidades de mayor riesgo.'],
          ['Construye una reserva', 'La liquidez evita que una necesidad inmediata te obligue a vender una inversión en un momento desfavorable.'],
          ['Distribuye entre categorías', 'Considera renta fija, renta variable, activos digitales, negocios físicos y estrategias especializadas de acuerdo con tus objetivos y capacidad de riesgo.'],
          ['Define un presupuesto de riesgo', 'Establece de antemano cuánto capital puede estar expuesto a estrategias de alta volatilidad. No improvises este número después de entrar al mercado.'],
          ['Evalúa cada componente', 'Revisa qué función cumple cada inversión, qué riesgo aporta y si sigue teniendo sentido dentro del portafolio completo.'],
          ['Reequilibra con disciplina', 'Un portafolio puede desviarse de su estructura original porque algunos activos suben más que otros. Revisarla permite decidir si la exposición sigue siendo adecuada.'],
        ],
      },
      {
        type: 'lesson',
        title: 'Antes de aumentar tus inversiones, revisa tus protecciones',
        paragraphs: [
          'Un portafolio de inversión debe construirse sobre una base financiera razonablemente protegida. Antes de pensar en incrementar la exposición a activos de alto riesgo, revisa si cuentas con **seguro de gastos médicos mayores** y, cuando corresponda, **seguro de vida**, especialmente si otras personas dependen de tus ingresos.',
          'En lugares donde la atención sanitaria pública no cubre adecuadamente determinadas necesidades o puede resultar insuficiente ante una emergencia, una cobertura privada puede evitar que un evento médico termine consumiendo el patrimonio que estabas intentando construir.',
          'La educación financiera no consiste únicamente en aprender a obtener rendimiento. También consiste en aprender a **evitar que un solo acontecimiento destruya años de trabajo y ahorro**.',
        ],
      },
      {
        type: 'lesson',
        title: 'La pregunta profesional',
        paragraphs: ['En lugar de preguntar únicamente **“¿cuánto puedo ganar?”**, acostúmbrate a preguntar:'],
        list: [
          '¿Cuánto puedo perder?', '¿Qué porcentaje de mi patrimonio representa?', '¿Qué función cumple esta inversión?',
          '¿Qué ocurre con mi portafolio de inversión si este activo cae?', '¿Tengo suficiente liquidez fuera de esta posición?',
          '¿Estoy diversificando realmente o solamente acumulando activos parecidos?',
        ],
      },
    ],
  },
  {
    id: '08',
    title: 'La filosofía QLC: limitar la exposición también es gestionar',
    intro: 'La última lección conecta la educación financiera con la política operativa de QLC: una estrategia profesional no debería medir su éxito únicamente por cuánto capital consigue administrar, sino también por cómo controla la exposición.',
    blocks: [
      {
        type: 'cards', cols: 2,
        items: [
          ['100 USDT · mínimo inicial', 'El documento conceptual establece esta cantidad como mínimo inicial dentro de la estructura planteada.'],
          ['2,000 USDT · máximo inicial', 'QLC establece este límite para nuevos participantes como parte de su metodología de control y distribución de exposición.'],
        ],
      },
      {
        type: 'bars',
        items: [['Asignación inicial', 25], ['Seguimiento', 50], ['Evaluación', 75], ['Posible invitación', 100]],
        note: 'La gráfica es ilustrativa y representa etapas del proceso, no porcentajes de rentabilidad ni probabilidades.',
      },
      {
        type: 'timeline',
        title: 'El proceso de crecimiento',
        steps: [
          ['Asignación inicial', 'El participante comienza con una asignación limitada.'],
          ['Gestión', 'La estrategia opera dentro de los parámetros establecidos por la infraestructura.'],
          ['Seguimiento', 'El participante puede observar el desempeño y comprender la metodología.'],
          ['Evaluación', 'Se evalúan la relación, las condiciones operativas y la capacidad de infraestructura.'],
          ['Invitación', 'Si corresponde, QLC puede invitar al participante a incrementar su asignación mediante comunicación formal.'],
        ],
      },
      { type: 'quote', text: 'Un portafolio inteligente no busca eliminar el riesgo. Busca que ningún riesgo individual tenga el poder de destruir toda la estructura patrimonial.' },
      { type: 'risk', label: 'Antes de tomar cualquier decisión:', text: 'QLC es una estrategia relacionada con activos digitales y trading, por lo que existe riesgo de mercado y, dependiendo de la operativa, riesgo asociado al apalancamiento. El límite de capital no convierte la estrategia en segura ni garantiza resultados.' },
    ],
  },
];

const EN = [
  {
    id: '01',
    title: 'What does investing really mean?',
    intro: 'Investing means placing capital in an asset, instrument, project or strategy expecting a future benefit. That benefit can come from interest, dividends, price growth, rent, cash flow or the result of a business activity.',
    blocks: [
      {
        type: 'cards', cols: 3, numbered: true,
        items: [
          ['Return', 'It is the result obtained by the capital over a period. It can be expressed in money or as a percentage. A positive return does not necessarily mean the investment was appropriate: it must always be compared with the risk taken.'],
          ['Risk', 'It is the possibility that the result differs from what was expected, including partial or total loss of capital. The more uncertain the result, the more attention exposure management requires.'],
          ['Horizon', 'It is the time you plan to hold the investment. A long-term goal can tolerate different fluctuations than an immediate need for liquidity.'],
        ],
      },
      {
        type: 'lesson',
        title: 'The first rule: investing should not immediately replace your source of income',
        paragraphs: [
          'For most people, investments should start as a **second source of income and wealth growth**, not as the money they depend on to pay their daily expenses.',
          'There is a huge difference between **building wealth** and trying to “become a millionaire overnight”. The second idea tends to push people toward excessive concentration, leverage and impulsive decisions. The first is built with time, contributions, discipline, reinvestment and proper risk management.',
          'Can you live off your investments? Yes. But the goal is usually reached when invested wealth is large enough to generate income that sustainably covers a person’s expenses. **You do not start by quitting your job; you start by building wealth that may someday allow it.**',
        ],
        example: ['Educational example:', 'imagine your monthly expenses are 2,000 monetary units. If your investments still produce small or variable results, leaving your main source of income to depend on them needlessly increases the pressure on your capital. A more prudent structure is to keep your productive activity while you progressively build your invested wealth.'],
      },
      {
        type: 'lesson',
        title: 'Before investing: first protect what could destroy your wealth',
        paragraphs: [
          'A complete financial education does not start by talking about returns. It starts by talking about **protection**. Before allocating a significant part of your wealth to investments, consider how you would face events that can create extraordinary expenses.',
          'Those protections include **major medical insurance** and **life insurance**, especially when there are financial dependents. In countries where public care may be insufficient, limited or involve long waiting times, adequate medical coverage can play a fundamental role for your wealth.',
          'The logic is simple: it would make little sense to chase extra returns while a medical emergency, an accident or the death of the person who earns the income could force you to liquidate investments or take on debt.',
        ],
        example: ['Conceptual order:', 'first protect your ability to earn income and face contingencies; then build liquidity; afterwards develop investments according to your goals and the risk you can take.'],
      },
      {
        type: 'lesson',
        title: 'Wealth in layers',
        paragraphs: ['A simple way to understand it is to think of your wealth as a structure with several layers:'],
        list: [
          '**Protection:** insurance and mechanisms to face events that could seriously affect your family or wealth.',
          '**Liquidity:** money available for emergencies, needs and opportunities.',
          '**Productive activity:** a job, profession or business that generates your main income.',
          '**Investments:** capital allocated to growth and complementary income.',
          '**High risk:** a limited portion allocated to opportunities with higher volatility and potential losses.',
        ],
        after: ['The goal is not for every layer to be the same size. The goal is that a single high-risk investment cannot endanger the whole structure.'],
      },
      {
        type: 'lesson',
        title: 'How to analyze any investment',
        list: [
          '**What am I buying?** Understand the asset or strategy.',
          '**Where does the potential return come from?** Interest, dividends, appreciation, rent, business operations, etc.',
          '**What can make me lose money?** Identify the specific risks.',
          '**When might I need the money?** Relate the investment to your horizon.',
          '**What percentage of my wealth does it represent?** This question introduces diversification.',
        ],
      },
    ],
  },
  {
    id: '02',
    title: 'Risk and return: why no one can eliminate risk',
    intro: 'One of the most important ideas in finance is that potential return and risk must be analyzed together. Seeking a higher return usually means accepting some combination of greater uncertainty, volatility, time or complexity.',
    blocks: [
      {
        type: 'cards', cols: 2,
        items: [
          ['Market risk', 'The price of an asset can rise or fall due to changes in supply and demand, rates, liquidity, expectations, news or macroeconomic conditions.'],
          ['Liquidity risk', 'An investment can have value but not be easy to sell at the desired price. Liquidity matters especially when the money may be needed quickly.'],
          ['Operational risk', 'It includes execution errors and failures in infrastructure, technology, processes, counterparties or the operation of a strategy.'],
          ['Leverage risk', 'Leverage lets you control a larger exposure with less margin, but it can also amplify the consequences of an adverse move.'],
        ],
      },
      {
        type: 'lesson',
        title: 'Volatility does not automatically mean loss',
        paragraphs: ['Volatility describes how much a price can change. A very volatile asset can rise quickly and also fall quickly. That is why a person should not look only at historical returns; they should look at how they were achieved, what exposure existed and what could happen under different conditions.'],
        example: ['Example:', 'two strategies can show the same return over a period. One may have achieved it with moderate fluctuations and the other through highly leveraged positions. The final number is the same, but the risk profile is completely different.'],
      },
      { type: 'risk', label: 'Golden rule:', text: 'past performance does not eliminate market risk. With digital assets and leveraged trading, losses can be significant and no past result guarantees future results.' },
    ],
  },
  {
    id: '03',
    title: 'Diversification: don’t put all your eggs in one basket',
    intro: 'Diversifying means spreading capital across different assets, strategies, sectors, income sources and, when appropriate, horizons. The aim is not to avoid every loss; it is to prevent a single event from determining the result of your entire wealth.',
    blocks: [
      {
        type: 'cards', cols: 3,
        items: [
          ['Liquidity reserve', 'Capital available for needs, contingencies and opportunities. Its role is to provide stability and avoid selling investments at a bad time because of an unexpected need.'],
          ['Fixed income', 'Instruments that can provide relative stability and defined cash flows, although they carry their own risks such as rates, inflation, issuer and liquidity.'],
          ['Equities', 'Stocks, funds and other instruments whose value can fluctuate. Their role in a portfolio may be related to wealth growth.'],
          ['Digital assets', 'A specific exposure to a highly volatile market with particular risks.'],
          ['Specialized strategies', 'Capital allocated to specific investment or trading methodologies, with defined risk and operating parameters.'],
          ['Physical businesses', 'Companies or productive activities that can generate cash flow and offer a source of return different from financial markets.'],
        ],
      },
      {
        type: 'lesson',
        title: 'Diversifying does not mean buying many things',
        paragraphs: [
          'Buying ten assets that behave almost the same does not necessarily create good diversification. The important question is **how related the risks are**. A portfolio can hold many positions and still depend too much on the same market or factor.',
          'Diversification can also happen across **cash-flow sources**. For example, a person can combine employment or business income, financial instruments and a small allocation to higher-risk strategies.',
        ],
      },
      {
        type: 'lesson',
        title: 'Why include a physical business?',
        paragraphs: [
          'Financial markets are not the only way to build wealth. A **physical business** can provide a source of cash flow tied to a productive activity: retail, services, food, manufacturing, space rental or other business activities.',
          'This does not mean a business is automatically safe. It also carries risks: expenses, competition, staff, demand, inventory, taxes, maintenance and tied-up capital. That is precisely why it is considered another piece of diversification, not a substitute for all other investments.',
          'The idea is to build different economic engines. While a professional or business activity can produce cash flow, a financial portfolio can seek long-term growth or income, and a small high-risk allocation can participate in more volatile opportunities.',
        ],
        example: ['Principle:', 'you don’t need all your assets to produce money the same way. The strength can lie in combining sources with different behaviors and risks.'],
      },
      {
        type: 'lesson',
        title: 'The final goal: for your wealth to pay your expenses',
        paragraphs: [
          'Financial independence is not simply having a large account. It means reaching a point where the **sustainable income produced by your wealth** is enough to cover your expenses without necessarily depending on your daily work.',
          'That point must be the result of a process. First you work or build a productive activity; then you save and protect part of the capital; then you invest; afterwards you reinvest and grow your wealth. Over time, if your wealth becomes large enough and the income it produces is sustainable, dependence on work can decrease.',
          'That is why quitting work too early can be a mistake. Your job, profession or business may be precisely the engine that finances the wealth that will someday let you work by choice rather than necessity.',
        ],
      },
      { type: 'quote', text: '“QLC does not seek to manage all your wealth. It seeks to become a strategic allocation within it.”', source: 'Central principle of the QLC Financial Education concept document.' },
    ],
  },
  {
    id: '04',
    title: 'Fixed income, equities and businesses: three pieces with different roles',
    intro: 'A balanced portfolio does not need all its components to do the same thing. Its value lies precisely in each component being able to play a different role.',
    blocks: [
      {
        type: 'table',
        head: ['Type', 'Possible role', 'Potential advantages', 'Risks / disadvantages'],
        rows: [
          ['Fixed income', 'Relative stability and cash-flow generation', 'Greater predictability in certain instruments', 'Inflation, rates, credit, liquidity and limited return'],
          ['Equities', 'Wealth growth', 'Participation in companies and appreciation potential', 'Volatility, market downturns and loss of capital'],
          ['Physical businesses', 'Cash flow and productive activity', 'Operating income and diversification outside markets', 'Operations, expenses, demand, staff, competition and tied-up capital'],
          ['Digital assets', 'Exposure to an alternative market', 'Access to a dynamic asset class', 'High volatility, variable liquidity and ecosystem-specific risks'],
        ],
      },
      {
        type: 'lesson',
        title: 'Your portfolio must respond to your goals',
        paragraphs: [
          'A person who needs liquidity may prioritize different instruments than someone with a horizon of many years. Likewise, someone with variable business income may value a liquidity reserve differently than a person with more stable income.',
          'That is why there is no universal percentage that is “the right portfolio” for everyone. An allocation must be built around the goal, horizon, capacity to absorb losses and need for liquidity.',
        ],
        example: ['Conceptual example:', 'think of a portfolio as a table. Liquidity, fixed income, equities, businesses and specialized strategies are different legs. They don’t all need to be the same size; what matters is that the whole structure makes sense.'],
      },
    ],
  },
  {
    id: '05',
    title: 'Trading: understanding what a high-risk strategy really is',
    intro: 'Trading seeks to take advantage of price movements through buying, selling or both, depending on the market and the strategy. It can use analysis, data, position management, automation and technology tools.',
    blocks: [
      {
        type: 'cards', cols: 3,
        items: [
          ['Analysis', 'The trader studies price, liquidity, volatility, volume, derivatives, positions and other data to build a market hypothesis.'],
          ['Execution', 'Entries and exits matter. In fast markets, the difference between the expected and executed price can change the result.'],
          ['Risk management', 'Position size, margin, total exposure and operating rules determine how much capital is committed.'],
        ],
      },
      {
        type: 'lesson',
        title: 'Why social media can create a distorted image',
        paragraphs: [
          'Online it is common to show only winning trades, screenshots of results or promises of profitability. That does not reveal the full distribution of results, the capital exposed, the negative periods or the risk used to achieve them.',
          'Professional trading, by contrast, must be analyzed as a **system**: methodology + data + infrastructure + execution + exposure control + discipline + evaluation.',
        ],
      },
      {
        type: 'lesson',
        title: 'Retail versus professional infrastructure',
        paragraphs: [
          'Many retail traders start with limited tools, make emotional decisions, use excessive position sizes or lack a consistent process. That can put them at a disadvantage against participants with better data, technology, experience and infrastructure.',
          'This does not mean every retail trader is destined to lose or that every professional trade wins. It means that **process and infrastructure matter**, especially when trading a fast, leveraged market.',
        ],
      },
      { type: 'risk', label: 'Conclusion:', text: 'trading should not be presented as an easy way to get rich. It is a high-risk activity that requires fully understanding what capital is being exposed and under which rules.' },
    ],
  },
  {
    id: '06',
    title: 'What place can QLC take within a portfolio?',
    intro: 'The QLC concept starts from a simple idea: a specialized trading strategy can exist within a portfolio, but it does not need to represent all of your wealth.',
    blocks: [
      {
        type: 'cards', cols: 2,
        items: [
          ['An allocation, not your wealth', 'QLC proposes a specific exposure with defined parameters. The conceptual goal is to prevent investors from concentrating all their wealth in a single high-risk strategy.'],
          ['Infrastructure and technology', 'The model is built around software, automation, operating infrastructure and algorithms to execute a defined methodology.'],
          ['Exposure control', 'QLC’s initial policy sets capital limits per main account as part of its methodology for distributing and controlling exposure.'],
          ['Follow-up before growing', 'Increasing an allocation is not automatic. It may depend on the relationship, operating conditions, evaluation and infrastructure capacity.'],
        ],
      },
      {
        type: 'lesson',
        title: 'Why an initial limit of 2,000 USDT?',
        paragraphs: [
          'According to the QLC concept document, the initial allocation has a minimum of **100 USDT** and a maximum of **2,000 USDT** per main account. The stated purpose is to keep managed capital within defined operating parameters and avoid excessive concentration of capital in a single operating account.',
          'The educational logic behind the limit is important: when an investment is high risk, increasing capital does not necessarily improve a portfolio’s structure. There must first be a reason to increase exposure.',
        ],
        example: ['Key idea:', 'if a person has diversified wealth, a limited allocation to a specialized strategy can let them participate without automatically making it the center of all their wealth.'],
      },
      { type: 'quote', text: '“Professional management also means knowing when not to increase exposure.”', source: 'Principle included in the QLC concept document.' },
    ],
  },
  {
    id: '07',
    title: 'How to build a portfolio step by step',
    intro: 'Now we bring together everything you have learned. The goal is not to give you a universal formula, but to teach you a mental process for making better decisions.',
    blocks: [
      {
        type: 'timeline',
        steps: [
          ['Assess your financial reality', 'Identify net worth, debts, income, expenses, liquidity and the capital you can really invest. Don’t start by choosing an asset; start by understanding your situation.'],
          ['Define your goals', 'Decide whether you want to preserve capital, generate cash flow, grow over the long term or take a specific exposure to higher-risk opportunities.'],
          ['Build a reserve', 'Liquidity prevents an immediate need from forcing you to sell an investment at a bad time.'],
          ['Spread across categories', 'Consider fixed income, equities, digital assets, physical businesses and specialized strategies according to your goals and risk capacity.'],
          ['Set a risk budget', 'Decide in advance how much capital can be exposed to high-volatility strategies. Don’t improvise this number after entering the market.'],
          ['Evaluate each component', 'Review what role each investment plays, what risk it adds and whether it still makes sense within the whole portfolio.'],
          ['Rebalance with discipline', 'A portfolio can drift from its original structure because some assets rise more than others. Reviewing it lets you decide whether the exposure is still appropriate.'],
        ],
      },
      {
        type: 'lesson',
        title: 'Before increasing your investments, review your protections',
        paragraphs: [
          'An investment portfolio should be built on a reasonably protected financial base. Before thinking about increasing exposure to high-risk assets, check whether you have **major medical insurance** and, when applicable, **life insurance**, especially if other people depend on your income.',
          'In places where public healthcare does not adequately cover certain needs or may be insufficient in an emergency, private coverage can prevent a medical event from consuming the wealth you were trying to build.',
          'Financial education is not only about learning to earn returns. It is also about learning to **prevent a single event from destroying years of work and savings**.',
        ],
      },
      {
        type: 'lesson',
        title: 'The professional question',
        paragraphs: ['Instead of asking only **“how much can I earn?”**, get used to asking:'],
        list: [
          'How much can I lose?', 'What percentage of my wealth does it represent?', 'What role does this investment play?',
          'What happens to my portfolio if this asset falls?', 'Do I have enough liquidity outside this position?',
          'Am I really diversifying or just accumulating similar assets?',
        ],
      },
    ],
  },
  {
    id: '08',
    title: 'The QLC philosophy: limiting exposure is also managing',
    intro: 'The last lesson connects financial education with QLC’s operating policy: a professional strategy should not measure its success only by how much capital it manages, but also by how it controls exposure.',
    blocks: [
      {
        type: 'cards', cols: 2,
        items: [
          ['100 USDT · initial minimum', 'The concept document sets this amount as the initial minimum within the proposed structure.'],
          ['2,000 USDT · initial maximum', 'QLC sets this limit for new participants as part of its methodology for controlling and distributing exposure.'],
        ],
      },
      {
        type: 'bars',
        items: [['Initial allocation', 25], ['Follow-up', 50], ['Evaluation', 75], ['Possible invitation', 100]],
        note: 'The chart is illustrative and represents stages of the process, not return percentages or probabilities.',
      },
      {
        type: 'timeline',
        title: 'The growth process',
        steps: [
          ['Initial allocation', 'The participant starts with a limited allocation.'],
          ['Management', 'The strategy operates within the parameters set by the infrastructure.'],
          ['Follow-up', 'The participant can observe performance and understand the methodology.'],
          ['Evaluation', 'The relationship, operating conditions and infrastructure capacity are evaluated.'],
          ['Invitation', 'If appropriate, QLC may invite the participant to increase their allocation through formal communication.'],
        ],
      },
      { type: 'quote', text: 'A smart portfolio does not seek to eliminate risk. It seeks to ensure that no single risk has the power to destroy the entire wealth structure.' },
      { type: 'risk', label: 'Before making any decision:', text: 'QLC is a strategy related to digital assets and trading, so there is market risk and, depending on the operation, risk associated with leverage. The capital limit does not make the strategy safe or guarantee results.' },
    ],
  },
];

export const LESSONS = { es: ES, en: EN };
