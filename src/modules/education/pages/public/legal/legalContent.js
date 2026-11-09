export const LEGAL_VERSION = '2026-11-08';
const CONTACT = import.meta.env.VITE_LEGAL_CONTACT_EMAIL || '';
const contactText = CONTACT ? `al correo ${CONTACT}` : 'a través de los canales oficiales de contacto de QLC Financial Education';
const contactTextEn = CONTACT ? `to ${CONTACT}` : 'through the official QLC Financial Education contact channels';

export const LEGAL_PATHS = { privacidad: '/privacidad', terminos: '/terminos' };

const ES = {
  privacidad: {
    label: 'Aviso de privacidad',
    title: 'Aviso de privacidad',
    intro: 'Este aviso explica qué datos personales trata QLC Financial Education, para qué los usa, con quién los comparte y cómo puedes ejercer tus derechos, conforme a la legislación mexicana aplicable en materia de protección de datos personales en posesión de particulares.',
    sections: [
      ['Responsable', [
        'QLC Financial Education es responsable del tratamiento de los datos personales que proporcionas al utilizar la plataforma.',
        `Para cualquier asunto relacionado con tus datos personales puedes escribirnos ${contactText}.`,
      ]],
      ['Datos que tratamos', [
        'Identificación y contacto: nombre, correo electrónico y, de forma opcional, teléfono.',
        'Datos de cuenta y seguridad: contraseña (almacenada solo como hash irreversible) y la clave de verificación en dos pasos (almacenada cifrada).',
        'Información financiera que tú mismo registras: ingresos, gastos, activos, deudas, presupuestos, metas, cortes mensuales y resultados de las herramientas educativas.',
        'Datos de compra: producto adquirido, monto, estado del pago y vigencia del acceso. QLC no almacena números completos de tarjetas; el cobro lo procesa el proveedor de pagos.',
        'Datos de uso: inicios de sesión y avance en los módulos, sin incluir cifras financieras en las métricas.',
      ]],
      ['Finalidades', [
        'Necesarias: crear y proteger tu cuenta, prestar el servicio educativo y de organización financiera, calcular indicadores y reportes, gestionar accesos y pagos, brindar soporte y cumplir obligaciones legales.',
        'Secundarias: mejorar la plataforma mediante métricas agregadas y enviarte comunicaciones informativas sobre el servicio. Puedes oponerte a las finalidades secundarias sin que esto afecte el servicio principal.',
      ]],
      ['Transferencias y encargados', [
        'Compartimos datos solo con proveedores que nos ayudan a operar la plataforma (alojamiento, base de datos, almacenamiento de imágenes y documentos, envío de correos y procesamiento de pagos), quienes actúan por nuestra cuenta y bajo obligaciones de confidencialidad.',
        'No vendemos tus datos personales. Solo los comunicaremos a autoridades cuando una ley o un mandato de autoridad competente lo exija.',
      ]],
      ['Derechos ARCO y revocación del consentimiento', [
        `Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos, así como revocar tu consentimiento, enviando tu solicitud ${contactText}. Indica tu nombre, el correo de tu cuenta, el derecho que deseas ejercer y una descripción clara de lo solicitado.`,
        'Responderemos en los plazos que establezca la legislación aplicable.',
      ]],
      ['Seguridad', [
        'Aplicamos medidas administrativas, técnicas y físicas razonables: cifrado de secretos, contraseñas con hash, verificación en dos pasos obligatoria y control de accesos por rol.',
      ]],
      ['Cookies y almacenamiento local', [
        'Usamos almacenamiento del navegador únicamente para mantener tu sesión y recordar preferencias de navegación, como el idioma. No usamos cookies publicitarias de terceros.',
      ]],
      ['Cambios a este aviso', [
        'Cualquier cambio se publicará en esta misma página con su fecha de actualización. Si el cambio es relevante, te lo informaremos dentro de la plataforma.',
      ]],
    ],
  },
  terminos: {
    label: 'Términos y condiciones',
    title: 'Términos y condiciones',
    intro: 'Estos términos regulan el uso de QLC Financial Education y la compra de sus productos. Al crear una cuenta o realizar una compra aceptas cumplirlos. Si no estás de acuerdo, no utilices la plataforma.',
    sections: [
      ['Naturaleza del servicio', [
        'QLC Financial Education es una plataforma educativa y de organización financiera. Sus contenidos, herramientas, simulaciones, estimaciones, reportes, consultas y sesiones de orientación tienen fines exclusivamente educativos e informativos.',
        'Nada en la plataforma constituye asesoría financiera, fiscal o legal personalizada, recomendación de inversión, oferta de valores ni garantía de resultados. Las decisiones que tomes son solo tuyas; consulta a un profesional autorizado cuando lo necesites.',
      ]],
      ['Riesgos', [
        'Toda inversión implica riesgos, incluida la posible pérdida del capital. Los activos digitales, el trading y el apalancamiento pueden generar pérdidas significativas. Los resultados pasados no garantizan resultados futuros.',
        'Las simulaciones, estimaciones de impuestos, intereses o inflación son aproximaciones basadas en los supuestos que tú introduces y pueden no coincidir con la realidad.',
      ]],
      ['Requisitos y cuenta', [
        'Para contratar debes ser mayor de edad y tener capacidad legal para obligarte. Cada cuenta es personal e intransferible: no puedes compartirla, venderla ni permitir que otra persona la use.',
        'Debes proporcionar información veraz, mantener actualizado tu correo y guardar la confidencialidad de tu contraseña y de tu dispositivo de verificación en dos pasos. Eres responsable de lo que ocurra en tu cuenta hasta que nos avises de un uso no autorizado.',
        'La verificación en dos pasos es obligatoria. Si olvidas tu contraseña puedes restablecerla con el código enviado a tu correo; al hacerlo deberás configurar de nuevo la verificación en dos pasos. Si pierdes el dispositivo, un administrador podrá restablecerla después de validar tu identidad.',
        'Eres responsable de la información financiera que registras y de las decisiones que tomes con base en ella.',
      ]],
      ['Productos y vigencia', [
        'Cada producto muestra antes de la compra lo que incluye, su precio y su vigencia. Las herramientas otorgan acceso a todas las herramientas financieras por el periodo contratado y no incluyen la Masterclass. Las membresías anuales incluyen las herramientas y la Masterclass por 12 meses, además de los beneficios indicados en cada membresía.',
        'La Masterclass por módulo se adquiere por separado, por el periodo indicado, y se avanza en orden: para adquirir un módulo debes haber terminado el anterior.',
        'Las consultas se descuentan al enviarlas. Las sesiones de orientación se descuentan al agendarlas; si cancelas la cita antes de que se realice, la sesión vuelve a tu saldo, y si no asistes sin haberla cancelado se considera utilizada. Las sesiones incluidas en una membresía solo pueden usarse durante su vigencia y no se acumulan después.',
        'Los accesos, consultas y sesiones son personales y no se pueden cambiar por dinero ni transferir a otra cuenta, salvo los códigos de regalo descritos más adelante.',
      ]],
      ['Precios y moneda de cobro', [
        'Los precios pueden expresarse en pesos mexicanos, dólares o USDT. Con Mercado Pago el precio se convierte a pesos mexicanos con el tipo de cambio que define QLC. Con transferencia interna Bitget el pago se hace en USDT. El monto exacto se muestra antes de que pagues.',
        'Tu banco o tu proveedor de pago pueden aplicar comisiones o tipos de cambio propios, que son ajenos a QLC y corren por tu cuenta.',
        'Los precios y el tipo de cambio pueden cambiar en cualquier momento. El cambio se aplica a compras nuevas y no afecta los accesos ya pagados.',
      ]],
      ['Formas de pago y procesadores', [
        'Las formas de pago dependen del país de residencia que declaras en tu cuenta, que debe ser verdadero. Si resides en México puedes pagar en la página de Mercado Pago, con los métodos que ofrezca, a cuyas condiciones también quedas sujeto; QLC no recibe ni guarda los datos de tu tarjeta. Desde cualquier país puedes pagar en USDT, por transferencia interna de Bitget al UID que indica la plataforma o enviándolos a la dirección de wallet que muestra, por la red indicada.',
        'En tu estado de cuenta puede aparecer el nombre del procesador de pago. En el pago con USDT debes reportar el N.º de orden o el hash de la transacción, la fecha y hora y tu evidencia; el acceso se activa cuando QLC confirma el pago, no al enviar el reporte. Tu evidencia se guarda en el almacenamiento de Google Drive de QLC. Eres responsable de que llegue el monto completo al UID o a la dirección correcta y por la red indicada: las transferencias de criptoactivos no se pueden revertir y los fondos enviados por otra red se pueden perder.',
      ]],
      ['Renovación de accesos', [
        'Con Mercado Pago, los productos mensuales o anuales son suscripciones con cobro automático a tu medio de pago en cada periodo, hasta que canceles en Mi acceso. Con transferencia Bitget no hay cobro automático: cada periodo debes pagar de nuevo antes del vencimiento. Te enviaremos un aviso por correo antes de que venza, pero el aviso no es condición para que el acceso termine. Si no pagas a tiempo, el acceso se bloquea hasta que lo renueves.',
        'Una suscripción con cobro automático sigue vigente hasta que la canceles desde Mi acceso. La cancelación evita los cobros futuros y conservas tu acceso hasta su vencimiento. Solo puedes tener una suscripción de este tipo activa, y para adquirir otro plan primero debes cancelarla. Eliminar tu cuenta también la cancela.',
      ]],
      ['Sin reembolsos', [
        'Todos los pagos son finales y no reembolsables, en cualquier forma de pago. No se realizan reembolsos totales ni parciales por cancelar antes del vencimiento, por no usar el producto, por periodos parciales, por cambio de plan, por renovaciones que no se cancelaron a tiempo, por eliminar la cuenta ni por suspensión debida al incumplimiento de estos términos.',
        'Lo anterior no limita los derechos irrenunciables que te reconozca la legislación de protección al consumidor aplicable. Si detectas un cobro duplicado, un error o un cargo que no reconoces, avísanos para revisarlo y atenderlo conforme a dicha legislación.',
      ]],
      ['Aclaraciones, contracargos y disputas', [
        `Antes de reclamar un cobro ante tu banco o tu proveedor de pago, escríbenos ${contactText} para intentar resolverlo.`,
        'Si se presenta un contracargo o una disputa, QLC puede suspender o retirar el acceso relacionado mientras se resuelve, y compartir con el procesador los registros de la compra y del uso del producto para atenderla.',
      ]],
      ['Regalos', [
        'Cada acceso regalado genera un código único, que debe canjearse dentro del plazo indicado al comprarlo. La vigencia empieza cuando se activa, no cuando se compra. Los regalos no se renuevan.',
        'Quien compra es responsable de entregar y resguardar el código. Un código no se puede cambiar por dinero, y un código perdido, compartido con otra persona o vencido no da derecho a reembolso.',
      ]],
      ['Promociones', [
        'Las promociones son personales, tienen una vigencia y un solo uso, y no se acumulan con otras. El acceso de un pago promocional se activa cuando el Administrador General de QLC lo autoriza. No se renuevan.',
      ]],
      ['Vencimiento, conservación y eliminación de datos', [
        'Al vencer un acceso, las funciones relacionadas se bloquean hasta que lo renueves. Tienes un mes para pagar. A los 10 días sin pagar te avisamos por correo que en 20 días se eliminará tu cuenta; a los 20 días, que se eliminará en 10 días; a los 29 días, que se eliminará en 1 día; y a los 30 días tu cuenta y tus datos se eliminan de forma definitiva.',
        'Puedes eliminar tu cuenta en cualquier momento desde la plataforma. La eliminación es definitiva: se borran tus datos y se pierden los accesos, consultas y sesiones que tengas, sin derecho a reembolso. Te recomendamos conservar por tu cuenta la información que necesites.',
      ]],
      ['Compartir datos y autorizar cambios', [
        'Solo tú decides si compartes tus datos con el equipo QLC. Con «Compartir mis datos» podrá verlos; con «Autorizar modificar mis datos» también podrá escribir en tu panel como si fueras tú, con fines educativos. Puedes retirar cualquiera de estos permisos en cualquier momento. Al terminar de compartir, se borra el chat de esa sesión.',
        'Los cambios hechos con tu autorización quedan registrados, no constituyen asesoría personalizada y no garantizan ningún resultado. Revisa la información de tu panel: sigues siendo responsable de ella y de tus decisiones.',
      ]],
      ['Uso permitido', [
        'No está permitido acceder a cuentas ajenas; intentar vulnerar la seguridad; automatizar solicitudes abusivas o extraer información de forma masiva; copiar, grabar, revender o redistribuir los contenidos; compartir accesos; usar datos de pago ajenos; ni usar la plataforma con fines ilícitos.',
      ]],
      ['Propiedad intelectual', [
        'Los contenidos educativos, textos, videos, diseños, herramientas y marcas de la plataforma son propiedad de QLC Financial Education o de sus licenciantes. Se otorga una licencia personal, limitada, revocable y no transferible para su uso dentro de la plataforma mientras tu acceso esté vigente. La información financiera que registras sigue siendo tuya.',
      ]],
      ['Disponibilidad, cambios al servicio y comunicaciones', [
        'Procuramos que la plataforma funcione de forma continua, pero no garantizamos que esté libre de errores o interrupciones por mantenimiento, fallas de terceros o causas de fuerza mayor. Podemos actualizar, mejorar o sustituir contenidos y funciones.',
        'Te enviaremos por correo avisos sobre tu cuenta, pagos y accesos. Puedes dejar de recibir promociones desde Mi acceso; los avisos necesarios para el servicio se seguirán enviando.',
      ]],
      ['Suspensión y terminación', [
        'Podemos suspender o cancelar, sin reembolso, cuentas que incumplan estos términos, que hagan uso fraudulento de la plataforma o de medios de pago, o cuando lo exija una autoridad.',
      ]],
      ['Responsabilidad', [
        'En la medida permitida por la ley, QLC Financial Education no será responsable por pérdidas derivadas de decisiones de inversión o financieras tomadas con base en la información de la plataforma, por daños indirectos, por información incorrecta que se haya registrado, ni por fallas de bancos, procesadores de pago u otros terceros.',
        'En la misma medida, la responsabilidad total de QLC frente a ti no excederá lo que hayas pagado en los 12 meses anteriores al hecho que la origine. Nada en estos términos limita los derechos que la ley no permita renunciar.',
      ]],
      ['Privacidad', [
        'Tus datos personales se tratan conforme al Aviso de privacidad, que forma parte de estos términos.',
      ]],
      ['Cambios, interpretación y legislación aplicable', [
        'Podemos actualizar estos términos; la versión vigente estará siempre publicada en esta página con su fecha. Si un cambio es relevante, procuraremos avisarte por la plataforma o por correo. Seguir usando la plataforma o comprar después del cambio implica que lo aceptas; lo ya pagado conserva la vigencia contratada.',
        'Si alguna disposición resulta inválida, las demás siguen vigentes. Que QLC no ejerza un derecho en un momento dado no significa que renuncie a él. No puedes ceder estos términos ni tu cuenta a otra persona.',
        'Estos términos se rigen por las leyes de los Estados Unidos Mexicanos, sin perjuicio de los derechos que te correspondan ante la Procuraduría Federal del Consumidor o las autoridades competentes.',
        `Para cualquier duda sobre estos términos, escríbenos ${contactText}.`,
      ]],
    ],
  },
};

const EN = {
  privacidad: {
    label: 'Privacy notice',
    title: 'Privacy notice',
    intro: 'This notice explains what personal data QLC Financial Education processes, what it is used for, who it is shared with and how you can exercise your rights, in accordance with applicable Mexican legislation on the protection of personal data held by private parties.',
    sections: [
      ['Data controller', [
        'QLC Financial Education is responsible for processing the personal data you provide when using the platform.',
        `For any matter related to your personal data you can write to us ${contactTextEn}.`,
      ]],
      ['Data we process', [
        'Identification and contact: name, email and, optionally, phone number.',
        'Account and security data: password (stored only as an irreversible hash) and the two-step verification key (stored encrypted).',
        'Financial information you record yourself: income, expenses, assets, debts, budgets, goals, monthly closings and results of the educational tools.',
        'Purchase data: product purchased, amount, payment status and access validity. QLC does not store full card numbers; payments are processed by the payment provider.',
        'Usage data: sign-ins and progress in the modules, without including financial figures in the metrics.',
      ]],
      ['Purposes', [
        'Necessary: create and protect your account, provide the educational and financial organization service, calculate indicators and reports, manage access and payments, provide support and comply with legal obligations.',
        'Secondary: improve the platform through aggregated metrics and send you informational communications about the service. You can object to secondary purposes without affecting the main service.',
      ]],
      ['Transfers and processors', [
        'We share data only with providers that help us operate the platform (hosting, database, image and document storage, email delivery and payment processing), who act on our behalf and under confidentiality obligations.',
        'We do not sell your personal data. We will only disclose it to authorities when required by law or by an order from a competent authority.',
      ]],
      ['ARCO rights and withdrawal of consent', [
        `You can access, rectify, cancel or object to the processing of your data, as well as withdraw your consent, by sending your request ${contactTextEn}. Include your name, your account email, the right you wish to exercise and a clear description of your request.`,
        'We will respond within the time limits set by applicable law.',
      ]],
      ['Security', [
        'We apply reasonable administrative, technical and physical measures: encryption of secrets, hashed passwords, mandatory two-step verification and role-based access control.',
      ]],
      ['Cookies and local storage', [
        'We use browser storage only to keep your session and remember your browsing preferences, such as language. We do not use third-party advertising cookies.',
      ]],
      ['Changes to this notice', [
        'Any change will be published on this page with its update date. If the change is relevant, we will inform you within the platform.',
      ]],
    ],
  },
  terminos: {
    label: 'Terms and conditions',
    title: 'Terms and conditions',
    intro: 'These terms govern the use of QLC Financial Education and the purchase of its products. By creating an account or making a purchase you agree to comply with them. If you do not agree, do not use the platform.',
    sections: [
      ['Nature of the service', [
        'QLC Financial Education is an educational and financial organization platform. Its content, tools, simulations, estimates, reports, consultations and guidance sessions are for educational and informational purposes only.',
        'Nothing on the platform constitutes personalized financial, tax or legal advice, an investment recommendation, an offer of securities or a guarantee of results. Your decisions are yours alone; consult a licensed professional when needed.',
      ]],
      ['Risks', [
        'Every investment involves risk, including the possible loss of capital. Digital assets, trading and leverage can cause significant losses. Past results do not guarantee future results.',
        'Simulations and estimates of taxes, interest or inflation are approximations based on the assumptions you enter and may differ from reality.',
      ]],
      ['Requirements and account', [
        'To purchase you must be of legal age and have legal capacity to enter into binding agreements. Each account is personal and non-transferable: you may not share it, sell it or let another person use it.',
        'You must provide truthful information, keep your email up to date and keep your password and two-step verification device confidential. You are responsible for what happens in your account until you notify us of unauthorized use.',
        'Two-step verification is mandatory. If you forget your password you can reset it with the code sent to your email; you will then need to set up two-step verification again. If you lose the device, an administrator can reset it after verifying your identity.',
        'You are responsible for the financial information you record and the decisions you make based on it.',
      ]],
      ['Products and validity', [
        'Before purchase, each product shows what it includes, its price and its validity. Tools give access to all financial tools for the contracted period and do not include the Masterclass. Annual memberships include the tools and the Masterclass for 12 months, plus the benefits stated for each membership.',
        'The Masterclass per module is purchased separately, for the stated period, and must be taken in order: to purchase a module you must have finished the previous one.',
        'Consultations are deducted when sent. Guidance sessions are deducted when scheduled; if you cancel the appointment before it takes place, the session returns to your balance, and if you do not attend without having cancelled it is considered used. Sessions included in a membership can only be used during its validity and do not carry over.',
        'Access, consultations and sessions are personal and cannot be exchanged for money or transferred to another account, except for the gift codes described below.',
      ]],
      ['Prices and charge currency', [
        'Prices may be stated in Mexican pesos, US dollars or USDT. With Mercado Pago the price is converted to Mexican pesos at the exchange rate set by QLC. With a Bitget internal transfer the payment is made in USDT. The exact amount is shown before you pay.',
        'Your bank or payment provider may apply its own fees or exchange rates, which are outside QLC’s control and are your responsibility.',
        'Prices and the exchange rate may change at any time. Changes apply to new purchases and do not affect access already paid for.',
      ]],
      ['Payment methods and processors', [
        'Payment methods depend on the country of residence you declare in your account, which must be true. If you live in Mexico you can pay on the Mercado Pago page, with the methods it offers, whose conditions also apply to you; QLC does not receive or store your card details. From any country you can pay in USDT, by Bitget internal transfer to the UID shown on the platform or by sending it to the wallet address shown, on the indicated network.',
        'Your statement may show the payment processor’s name. For a USDT payment you must report the order number or transaction hash, date and time, and your evidence; access activates when QLC confirms the payment, not when you send the report. Your evidence is stored in QLC’s Google Drive storage. You are responsible for the full amount reaching the correct UID or address on the indicated network: crypto asset transfers cannot be reversed and funds sent on another network may be lost.',
      ]],
      ['Access renewal', [
        'With Mercado Pago, monthly or annual products are subscriptions charged automatically to your payment method each period, until you cancel in My access. With a Bitget transfer there is no automatic charge: each period you must pay again before expiration. We will email you a notice before it expires, but the notice is not a condition for the access to end. If you do not pay in time, access is blocked until you renew it.',
        'A subscription with automatic billing stays in force until you cancel it from My access. Cancelling prevents future charges and you keep your access until expiration. You can only have one such subscription active, and to purchase another plan you must first cancel it. Deleting your account also cancels it.',
      ]],
      ['No refunds', [
        'All payments are final and non-refundable, for every payment method. No full or partial refunds are given for cancelling before expiration, not using the product, partial periods, plan changes, renewals not cancelled in time, deleting the account or suspension due to a breach of these terms.',
        'The above does not limit the non-waivable rights granted to you by applicable consumer protection law. If you detect a duplicate charge, an error or a charge you do not recognize, notify us so we can review it and handle it in accordance with that law.',
      ]],
      ['Clarifications, chargebacks and disputes', [
        `Before disputing a charge with your bank or payment provider, write to us ${contactTextEn} to try to resolve it.`,
        'If a chargeback or dispute occurs, QLC may suspend or remove the related access while it is resolved, and share purchase and product usage records with the processor to address it.',
      ]],
      ['Gifts', [
        'Each gifted access generates a unique code, which must be redeemed within the period stated at purchase. Validity starts when it is activated, not when it is purchased. Gifts do not renew.',
        'The purchaser is responsible for delivering and safeguarding the code. A code cannot be exchanged for money, and a lost, shared or expired code gives no right to a refund.',
      ]],
      ['Promotions', [
        'Promotions are personal, have a validity period and a single use, and cannot be combined with others. Access from a promotional payment activates when the QLC General Administrator authorizes it. They do not renew.',
      ]],
      ['Expiration, data retention and deletion', [
        'When an access expires, the related functions are blocked until you renew it. You have one month to pay. After 10 days without payment we email you that your account will be deleted in 20 days; after 20 days, that it will be deleted in 10 days; after 29 days, that it will be deleted in 1 day; and after 30 days your account and data are permanently deleted.',
        'You can delete your account at any time from the platform. Deletion is permanent: your data is erased and you lose any access, consultations and sessions you have, with no right to a refund. We recommend keeping on your own any information you need.',
      ]],
      ['Sharing data and authorizing changes', [
        'Only you decide whether to share your data with the QLC team. With "Share my data" they can see it; with "Authorize changes to my data" they can also write in your panel as if they were you, for educational purposes. You can withdraw either permission at any time. When sharing ends, the chat for that session is deleted.',
        'Changes made with your authorization are recorded, do not constitute personalized advice and do not guarantee any result. Review the information in your panel: you remain responsible for it and for your decisions.',
      ]],
      ['Permitted use', [
        'It is not permitted to access other people’s accounts; attempt to breach security; automate abusive requests or extract information in bulk; copy, record, resell or redistribute content; share access; use other people’s payment details; or use the platform for unlawful purposes.',
      ]],
      ['Intellectual property', [
        'The educational content, texts, videos, designs, tools and trademarks of the platform belong to QLC Financial Education or its licensors. A personal, limited, revocable and non-transferable license is granted for use within the platform while your access is valid. The financial information you record remains yours.',
      ]],
      ['Availability, service changes and communications', [
        'We strive to keep the platform running continuously, but we do not guarantee it will be free of errors or interruptions due to maintenance, third-party failures or force majeure. We may update, improve or replace content and features.',
        'We will send you emails about your account, payments and access. You can stop receiving promotions from My access; notices necessary for the service will still be sent.',
      ]],
      ['Suspension and termination', [
        'We may suspend or cancel, without refund, accounts that breach these terms or make fraudulent use of the platform or of payment methods, or when required by an authority.',
      ]],
      ['Liability', [
        'To the extent permitted by law, QLC Financial Education will not be liable for losses arising from investment or financial decisions made based on the platform’s information, for indirect damages, for incorrect information recorded, or for failures of banks, payment processors or other third parties.',
        'To the same extent, QLC’s total liability to you will not exceed what you paid in the 12 months before the event giving rise to it. Nothing in these terms limits rights that the law does not allow to be waived.',
      ]],
      ['Privacy', [
        'Your personal data is processed in accordance with the Privacy notice, which forms part of these terms.',
      ]],
      ['Changes, interpretation and governing law', [
        'We may update these terms; the current version will always be published on this page with its date. If a change is relevant, we will try to notify you through the platform or by email. Continuing to use the platform or purchasing after the change means you accept it; what has already been paid keeps its contracted validity.',
        'If any provision is invalid, the others remain in force. QLC not exercising a right at a given time does not mean it waives that right. You may not assign these terms or your account to another person.',
        'These terms are governed by the laws of the United Mexican States, without prejudice to your rights before the Federal Consumer Protection Agency (Profeco) or the competent authorities.',
        `For any question about these terms, write to us ${contactTextEn}.`,
      ]],
    ],
  },
};

export const LEGAL_CONTENT = {
  es: { updatedLabel: 'Última actualización', updated: '7 de noviembre de 2026', navLabel: 'Documentos legales', docs: ES },
  en: { updatedLabel: 'Last updated', updated: 'November 7, 2026', navLabel: 'Legal documents', docs: EN },
};
