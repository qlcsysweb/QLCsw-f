/*
 * TEXTOS DE LA PÁGINA PÚBLICA (español = value, inglés = valueEn) — viven en
 * el CÓDIGO, ya no en la base de datos: el sitio público no consulta NeonDB
 * para mostrarlos. Se generaron el 2026-10-20 con el contenido vigente del
 * CMS (respaldo: .qlc-backups/public_content_completo_2026-10-20.json).
 *
 * Para cambiar un texto, edítalo aquí y vuelve a desplegar. Si cambias el
 * Aviso de Privacidad o los Términos (sección "legal"), actualiza también
 * LEGAL_VERSIONS en backend/src/utils/legalVersions.js.
 */
const PUBLIC_CONTENT = {
  "como_funciona": {
    "connection_text": {
      "value": "QLC no necesita recibir ni trasladar el capital del cliente para ejecutar la estrategia. La conexión API permite la operación sobre la cuenta autorizada, con permisos limitados y sin autorización para retirar fondos.",
      "valueEn": "QLC doesn't need to receive or move the client's capital to execute the strategy. The API connection allows operation on the authorized account, with limited permissions and no authorization to withdraw funds."
    },
    "connection_title": {
      "value": "El capital permanece donde pertenece.",
      "valueEn": "The capital stays where it belongs."
    },
    "h2_line1": {
      "value": "Tu cuenta.",
      "valueEn": "Your account."
    },
    "h2_line2": {
      "value": "Nuestra infraestructura.",
      "valueEn": "Our infrastructure."
    },
    "kicker": {
      "value": "CÓMO FUNCIONA",
      "valueEn": "HOW IT WORKS"
    },
    "sub": {
      "value": "El flujo es directo: el cliente mantiene su cuenta en el exchange, autoriza una conexión API y QLC ejecuta la estrategia directamente sobre ella.",
      "valueEn": "The flow is direct: the client keeps their account on the exchange, authorizes an API connection, and QLC executes the strategy directly on it."
    }
  },
  "contacto": {
    "kicker": {
      "value": "QUANTUM LIQUIDITY CAPITAL",
      "valueEn": "QUANTUM LIQUIDITY CAPITAL"
    },
    "sub": {
      "value": "Trading cuantitativo · Algoritmos · Ejecución API · Microposiciones",
      "valueEn": "Quantitative trading · Algorithms · API Execution · Micro-positions"
    },
    "title": {
      "value": "COPYTRADING INSTITUCIONAL.",
      "valueEn": "INSTITUTIONAL COPYTRADING."
    }
  },
  "footer": {
    "disclaimer": {
      "value": "Los activos digitales y el trading apalancado implican riesgos significativos. Los resultados históricos no garantizan resultados futuros. La información presentada es de carácter informativo y está sujeta a los términos y condiciones aplicables.",
      "valueEn": "Digital assets and leveraged trading involve significant risks. Past performance does not guarantee future results. The information presented is for informational purposes and is subject to applicable terms and conditions."
    },
    "tagline": {
      "value": "Trading institucional. Accesible desde 100 USDT.",
      "valueEn": "Institutional trading. Accessible from 100 USDT."
    }
  },
  "hero": {
    "eyebrow": {
      "value": "Institutional Copytrading Infrastructure",
      "valueEn": "Institutional Copytrading Infrastructure"
    },
    "lead": {
      "value": "QLC es un sistema de copytrading institucional que ejecuta nuestra estrategia directamente en la cuenta del cliente mediante tecnología propia y una conexión API autorizada.",
      "valueEn": "QLC is an institutional copy-trading system that executes our strategy directly on the client's account using proprietary technology and an authorized API connection."
    },
    "mini_platform_label": {
      "value": "BITGET",
      "valueEn": "BITGET"
    },
    "mini_platform_value": {
      "value": "Elite Trader",
      "valueEn": "Elite Trader"
    },
    "title_line1": {
      "value": "Copytrading Institucional.",
      "valueEn": "Institutional Copytrading."
    },
    "title_line2": {
      "value": "Accesible desde 100 USDT.",
      "valueEn": "Accessible starting at 100 USDT."
    }
  },
  "legal": {
    "privacy_body": {
      "value": "QLC — Quantum Liquidity Capital. Última actualización: 03/10/2026.\n\n1. Responsable del tratamiento de datos personales. QUANTUM LIQUIDITY CAPITAL, S.A. DE C.V., en adelante \"QLC\", es responsable del tratamiento y protección de los datos personales proporcionados por los usuarios y clientes a través del sitio web, plataforma, aplicaciones, formularios y servicios de QLC. Este Aviso de Privacidad Global está destinado a usuarios y clientes ubicados fuera de los Estados Unidos de América. QLC podrá ofrecer sus servicios en diferentes jurisdicciones, siempre sujeto a la disponibilidad del servicio y a las leyes y regulaciones aplicables en cada país.\n\n2. Alcance de este Aviso. Este Aviso de Privacidad se aplica a los datos personales que QLC recopile a través de: sitio web de QLC, plataforma de QLC, registro de usuarios, servicios de Copytrading Privado, vinculación de cuentas de Exchange mediante API, comunicaciones con clientes, estados de cuenta, soporte y atención al cliente, y cualquier otro servicio o interacción proporcionada por QLC. Este Aviso podrá complementarse con información específica cuando una determinada jurisdicción exija requisitos adicionales.\n\n3. Información que podemos recopilar. Datos de identificación: nombre completo, fecha de nacimiento, nacionalidad, país de residencia, documento de identificación cuando sea necesario, información necesaria para verificar la identidad. Datos de contacto: correo electrónico, número telefónico, domicilio o país de residencia cuando resulte necesario. Datos relacionados con la cuenta: datos de acceso y registro de la plataforma, identificadores de cuenta, información relacionada con la cuenta del Exchange, información necesaria para la conexión mediante API. Datos relacionados con el servicio: operaciones ejecutadas, movimientos, resultados, capital destinado al servicio, estados de cuenta, historial de actividad dentro de la plataforma. Datos técnicos: dirección IP, tipo de dispositivo, sistema operativo, navegador, información técnica necesaria para seguridad, funcionamiento y prevención de usos indebidos. QLC procurará recopilar únicamente la información necesaria para las finalidades descritas en este Aviso.\n\n4. Información que QLC no solicita. QLC no solicita al cliente: claves privadas de wallets, frases semilla, contraseñas de wallets, claves de recuperación. Cuando el servicio requiera una conexión mediante API, esta deberá configurarse utilizando únicamente los permisos necesarios para la prestación del servicio y sin permisos de retiro de fondos, cuando así corresponda al modelo operativo.\n\n5. Finalidades del tratamiento. QLC podrá utilizar los datos personales para: crear y administrar la cuenta del usuario; identificar y verificar al cliente; proporcionar los servicios contratados; gestionar la vinculación de cuentas; gestionar conexiones API; ejecutar las operaciones autorizadas dentro del servicio; registrar operaciones y actividad; generar estados de cuenta; proporcionar soporte y atención al cliente; comunicarse con el cliente respecto del servicio; detectar y prevenir usos indebidos, fraude o incidentes de seguridad; mantener la seguridad de la plataforma; cumplir obligaciones legales y regulatorias; atender requerimientos de autoridades competentes; defender los derechos e intereses legales de QLC.\n\n6. Comunicaciones comerciales. Cuando resulte legalmente permitido, QLC podrá utilizar los datos de contacto para enviar información relacionada con nuevos servicios, actualizaciones, funcionalidades e información comercial de QLC. El usuario podrá solicitar dejar de recibir comunicaciones comerciales en cualquier momento mediante los mecanismos proporcionados por QLC.\n\n7. Base jurídica del tratamiento. QLC tratará los datos personales de acuerdo con la legislación aplicable en el país de residencia del usuario. Dependiendo de la jurisdicción y de la finalidad, el tratamiento podrá basarse, entre otros fundamentos, en: el consentimiento del titular; la ejecución de un servicio solicitado por el cliente; el cumplimiento de obligaciones legales; intereses legítimos de QLC, cuando sean legalmente aplicables; la protección de derechos, seguridad y prevención del fraude.\n\n8. Transferencias y proveedores. Para proporcionar sus servicios, QLC podrá utilizar proveedores tecnológicos, servicios de infraestructura, seguridad, comunicaciones, almacenamiento y otros proveedores necesarios para el funcionamiento de la plataforma. Cuando sea necesario compartir información con terceros, QLC procurará limitar la información transferida a aquella necesaria para la finalidad correspondiente y aplicará las medidas de protección exigidas por la legislación aplicable. Cuando una transferencia internacional de datos requiera mecanismos adicionales de protección, QLC procurará utilizar los mecanismos legalmente reconocidos en la jurisdicción correspondiente.\n\n9. Conservación de la información. QLC conservará los datos personales durante el tiempo necesario para prestar los servicios, mantener los registros correspondientes, cumplir obligaciones legales, resolver controversias, prevenir fraude y usos indebidos, y ejercer o defender derechos legales. Cuando la información deje de ser necesaria, será eliminada, anonimizada o bloqueada de acuerdo con la legislación aplicable.\n\n10. Seguridad de la información. QLC implementará medidas técnicas, administrativas y organizativas razonables para proteger los datos personales contra acceso no autorizado, pérdida, alteración, destrucción, divulgación no autorizada y uso indebido. El nivel de seguridad aplicado podrá variar dependiendo de la naturaleza de la información y de los riesgos asociados al tratamiento.\n\n11. Derechos de los usuarios. Dependiendo del país de residencia y de la legislación aplicable, el titular podrá tener derechos relacionados con sus datos personales, incluyendo: acceso, rectificación, eliminación o cancelación, oposición, limitación del tratamiento, portabilidad, revocación del consentimiento, retiro del consentimiento para determinadas finalidades, y derecho a presentar reclamaciones ante la autoridad competente. Los derechos disponibles y las condiciones para ejercerlos dependerán de la legislación aplicable en la jurisdicción correspondiente.\n\n12. Ejercicio de derechos. Para ejercer sus derechos o realizar una consulta relacionada con la privacidad, el titular podrá contactar a QLC mediante el correo de privacidad: legal@qlctrade.net. La solicitud deberá proporcionar información suficiente para verificar la identidad del solicitante y atender adecuadamente la petición. QLC responderá dentro de los plazos establecidos por la legislación aplicable.\n\n13. Cookies y tecnologías similares. El sitio web y las plataformas de QLC podrán utilizar cookies y tecnologías similares para mantener sesiones, mejorar la seguridad, recordar determinadas preferencias, analizar el funcionamiento de la plataforma y mejorar la experiencia del usuario. El usuario podrá administrar determinadas cookies mediante las configuraciones de su navegador o mediante las herramientas proporcionadas por QLC.\n\n14. Menores de edad. Los servicios de QLC están destinados a personas que tengan capacidad legal para contratar y utilizar los servicios correspondientes. QLC no busca recopilar deliberadamente información personal de menores de edad cuando dicha recopilación esté prohibida por la legislación aplicable. Si QLC detecta que ha recopilado información de un menor en circunstancias en las que dicha recopilación no está permitida, podrá tomar medidas para eliminarla.\n\n15. Cambios al Aviso de Privacidad. QLC podrá actualizar este Aviso de Privacidad cuando sea necesario debido a cambios en los servicios, la plataforma, las prácticas de tratamiento de datos, la legislación aplicable o los requisitos regulatorios. La versión vigente estará disponible en el sitio web de QLC. Cuando la legislación aplicable requiera una comunicación o consentimiento adicional debido a un cambio sustancial, QLC realizará las acciones correspondientes.\n\n16. Legislación aplicable según la jurisdicción. QLC reconoce que los derechos y obligaciones relacionados con la protección de datos pueden variar entre países. Por ello, este Aviso de Privacidad Global deberá interpretarse conjuntamente con las disposiciones obligatorias de protección de datos aplicables en el país de residencia del titular. Cuando una legislación local otorgue derechos adicionales o establezca requisitos específicos que no estén expresamente contemplados en este Aviso, prevalecerán las disposiciones obligatorias de dicha legislación.\n\n17. Exclusión territorial. Este Aviso de Privacidad Global está destinado a usuarios y clientes fuera de los Estados Unidos de América. QLC no ofrece mediante este Aviso una declaración de cumplimiento específica de las leyes estatales o federales de privacidad de los Estados Unidos. El acceso a los servicios estará sujeto además a las restricciones territoriales y regulatorias que QLC determine para cada jurisdicción.\n\n18. Contacto. QLC — Quantum Liquidity Capital. Responsable: QUANTUM LIQUIDITY CAPITAL. Correo de privacidad y asuntos legales: legal@qlctrade.net. Soporte y atención al cliente: soporte@qlctrade.net. Sitio web: www.qlctrade.net.",
      "valueEn": "QLC — Quantum Liquidity Capital. Last updated: October 3, 2026.\n\n1. Data Controller. QUANTUM LIQUIDITY CAPITAL, S.A. DE C.V. (hereinafter \"QLC\") is responsible for the processing and protection of personal data provided by users and clients through QLC’s website, platform, applications, forms, and services. This Global Privacy Notice is intended for users and clients located outside the United States of America. QLC may offer its services in various jurisdictions, subject to service availability and the laws and regulations applicable in each country.\n\n2. Scope of this Notice. This Privacy Notice applies to personal data collected by QLC through: the QLC website, the QLC platform, user registration, Private Copytrading services, Exchange account linking via API, client communications, account statements, customer support, and any other service or interaction provided by QLC. This Notice may be supplemented with specific information when a particular jurisdiction mandates additional requirements.\n\n3. Information We May Collect. Identification data: full name, date of birth, nationality, country of residence, identification document (where necessary), and information required to verify identity. Contact data: email address, phone number, and home address or country of residence (where necessary). Account-related data: platform access and registration details, account identifiers, Exchange account information, and information required for API connection. Service-related data: executed trades, transactions, results, capital allocated to the service, account statements, and platform activity history. Technical data: IP address, device type, operating system, browser, and technical information necessary for security, functionality, and the prevention of misuse. QLC will endeavor to collect only the information necessary for the purposes described in this Notice. 4. Information QLC does not request. QLC does not request the following from the client: wallet private keys, seed phrases, wallet passwords, or recovery keys. When the service requires an API connection, it must be configured using only the permissions necessary for service delivery and without fund withdrawal permissions, where applicable to the operating model.\n\n5. Purposes of processing. QLC may use personal data to: create and manage the user account; identify and verify the client; provide the contracted services; manage account linking; manage API connections; execute authorized operations within the service; log operations and activity; generate account statements; provide customer support and service; communicate with the client regarding the service; detect and prevent misuse, fraud, or security incidents; maintain platform security; comply with legal and regulatory obligations; respond to requests from competent authorities; defend QLC’s legal rights and interests.\n\n6. Commercial communications. Where legally permitted, QLC may use contact details to send information regarding new services, updates, features, and commercial information from QLC. Users may request to stop receiving commercial communications at any time using the mechanisms provided by QLC.\n\n7. Legal basis for processing. QLC will process personal data in accordance with the applicable legislation in the user's country of residence. Depending on the jurisdiction and the purpose, processing may be based on, among other grounds: the data subject's consent; the performance of a service requested by the client; compliance with legal obligations; QLC’s legitimate interests, where legally applicable; the protection of rights, security, and fraud prevention.\n\n8. Transfers and service providers. To provide its services, QLC may use technology providers, as well as providers of infrastructure, security, communications, storage, and other services necessary for the platform's operation. When it is necessary to share information with third parties, QLC will endeavor to limit the transferred information to what is necessary for the relevant purpose and will apply the protection measures required by applicable law. When an international data transfer requires additional protection mechanisms, QLC will endeavor to use mechanisms legally recognized in the relevant jurisdiction.\n\n9. Data retention. QLC will retain personal data for the time necessary to provide the services, maintain relevant records, comply with legal obligations, resolve disputes, prevent fraud and misuse, and exercise or defend legal rights. When the information is no longer necessary, it will be deleted, anonymized, or blocked in accordance with applicable law.\n\n10. Information Security. QLC will implement reasonable technical, administrative, and organizational measures to protect personal data against unauthorized access, loss, alteration, destruction, unauthorized disclosure, and misuse. The level of security applied may vary depending on the nature of the information and the risks associated with the processing.\n\n11. User Rights. Depending on the country of residence and applicable law, the data subject may have rights regarding their personal data, including: access, rectification, deletion or cancellation, objection, restriction of processing, portability, revocation of consent, withdrawal of consent for specific purposes, and the right to lodge complaints with the competent authority. The available rights and the conditions for exercising them will depend on the legislation applicable in the relevant jurisdiction.\n\n12. Exercise of Rights. To exercise their rights or make a privacy-related inquiry, the data subject may contact QLC via the privacy email address: legal@qlctrade.net. The request must provide sufficient information to verify the requester's identity and properly address the request. QLC will respond within the timeframes established by applicable law.\n\n13. Cookies and Similar Technologies. QLC’s website and platforms may use cookies and similar technologies to maintain sessions, enhance security, remember certain preferences, analyze platform performance, and improve the user experience. Users may manage certain cookies through their browser settings or tools provided by QLC.\n\n14. Minors. QLC’s services are intended for individuals with the legal capacity to enter into contracts and use the relevant services. QLC does not seek to knowingly collect personal information from minors where such collection is prohibited by applicable law. If QLC discovers that it has collected information from a minor under circumstances where such collection is not permitted, it may take steps to delete it.\n\n15. Changes to the Privacy Notice. QLC may update this Privacy Notice when necessary due to changes in services, the platform, data processing practices, applicable law, or regulatory requirements. The current version will be available on the QLC website. When applicable law requires additional notification or consent due to a material change, QLC will take the appropriate actions.\n\n16. Applicable legislation by jurisdiction. QLC acknowledges that rights and obligations regarding data protection may vary across countries. Therefore, this Global Privacy Notice must be interpreted in conjunction with the mandatory data protection provisions applicable in the data subject's country of residence. Where local legislation grants additional rights or establishes specific requirements not expressly covered in this Notice, the mandatory provisions of such legislation shall prevail.\n\n17. Territorial exclusion. This Global Privacy Notice is intended for users and clients outside the United States of America. Through this Notice, QLC does not make any statement regarding compliance with United States state or federal privacy laws. Access to the services shall also be subject to territorial and regulatory restrictions determined by QLC for each jurisdiction.\n\n18. Contact. QLC — Quantum Liquidity Capital. Data Controller: QUANTUM LIQUIDITY CAPITAL, S.A. DE C.V. Address: [ADDRESS]. Privacy and legal email: legal@qlctrade.net. Customer support: soporte@qlctrade.net. Website: www.qlctrade.net."
    },
    "privacy_title": {
      "value": "Aviso de Privacidad",
      "valueEn": "Privacy Notice"
    },
    "terms_body": {
      "value": "TÉRMINOS Y CONDICIONES DEL SERVICIO DE COPYTRADING PRIVADO QLC. Última actualización: 03/10/2026.\n\n1. Aceptación de los Términos. Al registrarse en la plataforma QLC y seleccionar la casilla \"He leído y acepto los Términos y Condiciones del Servicio de Copytrading de QLC\", el cliente declara haber leído, comprendido y aceptado íntegramente estos Términos y Condiciones. La aceptación electrónica constituye la autorización del cliente para contratar y utilizar el servicio conforme a las condiciones aquí establecidas.\n\n2. Naturaleza del servicio. QLC proporciona un servicio de Copytrading Privado, mediante el cual el cliente puede vincular su cuenta de trading para permitir la ejecución de operaciones conforme a la estrategia operativa seleccionada. El servicio se presta bajo un esquema no custodial. El capital del cliente permanece en su propia cuenta de trading y QLC no recibe, mantiene ni administra directamente los fondos del cliente.\n\n3. Custodia de los fondos. El cliente conserva en todo momento la titularidad y custodia de sus fondos depositados en su cuenta de Bitget. QLC no solicita ni requiere permisos de retiro de fondos. La conexión mediante API deberá configurarse únicamente con los permisos necesarios para la ejecución de operaciones. QLC no podrá retirar fondos de la cuenta del cliente.\n\n4. Autorización mediante API. Para utilizar el servicio, el cliente deberá proporcionar o configurar las credenciales API necesarias para conectar su cuenta con la plataforma QLC. El cliente autoriza a QLC a utilizar dicha conexión exclusivamente para las funciones autorizadas por el cliente. El cliente será responsable de mantener bajo su control las credenciales y configuraciones de seguridad de su cuenta.\n\n5. Ejecución de operaciones. El cliente entiende y acepta que las operaciones ejecutadas mediante el servicio pueden experimentar diferencias respecto de la operación de referencia debido a movimientos del mercado, liquidez disponible, volatilidad, deslizamiento, diferencias de precio, latencia, condiciones de mercado, limitaciones técnicas del Exchange, interrupciones de conexión y diferencias en la ejecución entre cuentas. Por estas razones, QLC no garantiza que todas las cuentas obtengan exactamente el mismo precio de entrada, salida o resultado de la cuenta de referencia.\n\n6. Riesgo de mercado. El cliente reconoce que el trading de activos digitales conlleva un riesgo elevado y que puede producir pérdidas parciales o totales del capital destinado a la operativa. Los resultados históricos o anteriores no constituyen garantía de resultados futuros. El cliente declara comprender que las condiciones del mercado pueden cambiar y afectar el comportamiento de la estrategia.\n\n7. Capital del cliente. El cliente será responsable de determinar el capital que desea destinar al servicio y de mantener los fondos necesarios en su cuenta de trading. QLC no será responsable de decisiones de depósito, retiro o transferencia realizadas directamente por el cliente.\n\n8. Garantía de participación. Cuando el modelo de participación correspondiente establezca una garantía mínima, el cliente deberá cubrir el importe establecido antes de la activación de su participación. La garantía y su funcionamiento serán los establecidos en la información correspondiente al modelo de participación seleccionado por el cliente. La existencia de una garantía dentro del modelo no debe interpretarse como una garantía de que el mercado no generará pérdidas ni como una promesa de rentabilidad futura.\n\n9. Activación del servicio. Una vez que el cliente haya completado su registro, haya aceptado estos Términos y Condiciones, haya configurado correctamente su conexión API, haya cumplido los requisitos correspondientes al modelo de participación, y haya completado las acciones necesarias para la activación, QLC podrá verificar la información y proceder a activar el servicio.\n\n10. Estado de cuenta. Una vez activado el servicio, el cliente podrá consultar la información correspondiente a su participación mediante el estado de cuenta proporcionado por QLC. El estado de cuenta podrá incluir, entre otros datos: capital destinado, operaciones realizadas, resultados, movimientos, periodo de participación, garantía correspondiente, pagos realizados e información acumulada del periodo.\n\n11. Resultados y rentabilidad. Cualquier objetivo, referencia o resultado mostrado en la plataforma deberá entenderse como información correspondiente al modelo o estrategia y no como una promesa de rentabilidad futura, salvo que expresamente se establezca una obligación jurídicamente válida y permitida por la legislación aplicable. QLC no garantiza que el comportamiento futuro de la estrategia sea igual al comportamiento histórico.\n\n12. Responsabilidad del cliente. El cliente es responsable de: proporcionar información verdadera y actualizada; mantener segura su cuenta de Bitget; configurar correctamente sus APIs; no compartir sus credenciales con terceros; mantener los fondos necesarios para su operativa; revisar periódicamente su estado de cuenta; informar cualquier irregularidad detectada; cumplir las obligaciones fiscales y legales que le correspondan.\n\n13. Responsabilidad de QLC. QLC se compromete a proporcionar el servicio conforme a las características publicadas y a utilizar la conexión API únicamente dentro de los permisos autorizados. QLC no será responsable de pérdidas ocasionadas por acontecimientos fuera de su control razonable, incluyendo fallos del Exchange, interrupciones de servicios, movimientos extraordinarios del mercado, problemas de liquidez, errores de terceros o acontecimientos técnicos ajenos a QLC.\n\n14. Suspensión o desconexión. QLC podrá suspender temporalmente la ejecución cuando resulte necesario por razones técnicas, de seguridad, mantenimiento, riesgo operativo o circunstancias extraordinarias. El cliente podrá solicitar la desconexión del servicio conforme al procedimiento establecido en la plataforma.\n\n15. Modificaciones. QLC podrá actualizar estos Términos y Condiciones cuando resulte necesario. Las modificaciones serán publicadas en la plataforma y, cuando corresponda, se solicitará al cliente una nueva aceptación antes de continuar utilizando determinadas funcionalidades.\n\n16. Información y comunicaciones. El cliente acepta recibir comunicaciones relacionadas con: funcionamiento del servicio, operaciones, estados de cuenta, incidencias, mantenimiento, modificaciones del servicio y actualizaciones de los Términos y Condiciones.\n\n17. Privacidad y protección de información. QLC tratará los datos proporcionados por el cliente de conformidad con su Aviso de Privacidad y con la legislación aplicable. La información relacionada con las cuentas, APIs, operaciones y resultados del cliente será tratada únicamente para las finalidades correspondientes al servicio y aquellas obligaciones legales aplicables.\n\n18. Declaración del cliente. Al aceptar estos Términos y Condiciones, el cliente declara que: comprende la naturaleza del servicio; comprende que existe riesgo de pérdida; mantiene el control y la custodia de sus fondos en el Exchange; autoriza la conexión API conforme a los permisos establecidos; comprende que QLC no tiene autorización para retirar fondos; ha proporcionado información verdadera; acepta utilizar el servicio bajo su propia responsabilidad y conforme a estos Términos.\n\n19. Aceptación electrónica. Al marcar las casillas correspondientes y seleccionar \"Aceptar y continuar\", el cliente manifiesta expresamente su consentimiento respecto de estos Términos y Condiciones y de la autorización de conexión API. QLC conservará el registro electrónico de la aceptación, incluyendo la versión de los Términos aceptada y la fecha y hora correspondiente.\n\n20. Contacto. Para asuntos legales relacionados con estos Términos y Condiciones, el cliente podrá escribir a legal@qlctrade.net. Para soporte y atención al cliente: soporte@qlctrade.net.",
      "valueEn": "QLC PRIVATE COPYTRADING SERVICE TERMS AND CONDITIONS. Last updated: October 3, 2026.\n\n1. Acceptance of Terms. By registering on the QLC platform and checking the box \"I have read and accept the QLC Copytrading Service Terms and Conditions,\" the client declares that they have read, understood, and fully accepted these Terms and Conditions. Electronic acceptance constitutes the client's authorization to contract and use the service in accordance with the conditions set forth herein.\n\n2. Nature of the Service. QLC provides a Private Copytrading service, through which the client can link their trading account to allow the execution of trades based on the selected trading strategy. The service operates under a non-custodial model. The client's capital remains in their own trading account, and QLC does not receive, hold, or directly manage the client's funds.\n\n3. Custody of Funds. The client retains ownership and custody of the funds deposited in their Bitget account at all times. QLC does not request or require permissions to withdraw funds. The API connection must be configured solely with the permissions necessary for trade execution. QLC cannot withdraw funds from the client's account.\n\n4. API Authorization. To use the service, the client must provide or configure the API credentials necessary to connect their account to the QLC platform. The client authorizes QLC to use said connection exclusively for functions authorized by the client. The client is responsible for maintaining control over their account credentials and security configurations.\n\n5. Execution of Operations. The client understands and accepts that operations executed via the service may differ from the reference operation due to market movements, available liquidity, volatility, slippage, price discrepancies, latency, market conditions, technical limitations of the Exchange, connection interruptions, and execution differences between accounts. For these reasons, QLC does not guarantee that all accounts will obtain the exact same entry price, exit price, or result as the reference account.\n\n6. Market Risk. The client acknowledges that trading digital assets entails high risk and may result in partial or total loss of the capital allocated to trading activities. Historical or past results do not guarantee future results. The client declares an understanding that market conditions may change and affect the strategy's performance.\n\n7. Client Capital. The client is responsible for determining the capital to be allocated to the service and for maintaining the necessary funds in their trading account. QLC shall not be liable for deposit, withdrawal, or transfer decisions made directly by the client.\n\n8. Participation Guarantee. When the applicable participation model establishes a minimum guarantee, the client must cover the specified amount prior to the activation of their participation. The terms and operation of the guarantee shall be as set forth in the information regarding the participation model selected by the client. The existence of a guarantee within the model shall not be construed as a guarantee against market losses or as a promise of future profitability.\n\n9. Service activation. Once the client has completed registration, accepted these Terms and Conditions, correctly configured their API connection, met the requirements corresponding to the participation model, and completed the necessary actions for activation, QLC may verify the information and proceed to activate the service.\n\n10. Account statement. Once the service is activated, the client may view information regarding their participation via the account statement provided by QLC. The account statement may include, among other data: allocated capital, executed trades, results, transactions, participation period, applicable collateral, payments made, and accumulated period information.\n\n11. Results and profitability. Any objective, benchmark, or result displayed on the platform is to be understood as information pertaining to the model or strategy, not as a promise of future profitability, unless a legally valid obligation permitted by applicable law is expressly established. QLC does not guarantee that the strategy's future performance will mirror its historical performance.\n\n12. Client responsibility. The client is responsible for: providing accurate and up-to-date information; keeping their Bitget account secure; correctly configuring their APIs; not sharing credentials with third parties; maintaining the necessary funds for trading operations; periodically reviewing their account statement; reporting any detected irregularities; and complying with applicable tax and legal obligations.\n\n13. QLC responsibility. QLC commits to providing the service in accordance with published specifications and to using the API connection solely within authorized permissions. QLC shall not be liable for losses caused by events beyond its reasonable control, including exchange failures, service interruptions, extraordinary market movements, liquidity issues, third-party errors, or technical events external to QLC.\n\n14. Suspension or disconnection. QLC may temporarily suspend performance when necessary for reasons of technical issues, security, maintenance, operational risk, or extraordinary circumstances. The client may request disconnection of the service in accordance with the procedure established on the platform.\n\n15. Modifications. QLC may update these Terms and Conditions when necessary. Modifications will be published on the platform, and, where applicable, the client will be asked to provide new acceptance before continuing to use certain functionalities.\n\n16. Information and communications. The client agrees to receive communications regarding: service operation, transactions, account statements, issues, maintenance, service modifications, and updates to the Terms and Conditions.\n\n17. Privacy and information protection. QLC will process the data provided by the client in accordance with its Privacy Notice and applicable law. Information regarding the client's accounts, APIs, operations, and results will be processed solely for purposes related to the service and to comply with applicable legal obligations.\n\n18. Client declaration. By accepting these Terms and Conditions, the client declares that: they understand the nature of the service; they understand that there is a risk of loss; they maintain control and custody of their funds on the Exchange; they authorize the API connection in accordance with the established permissions; they understand that QLC is not authorized to withdraw funds; they have provided truthful information; and they agree to use the service at their own risk and in accordance with these Terms.\n\n19. Electronic acceptance. By checking the corresponding boxes and selecting \"Accept and continue,\" the client expressly provides their consent regarding these Terms and Conditions and the API connection authorization. QLC will retain an electronic record of the acceptance, including the version of the Terms accepted and the corresponding date and time.\n\n20. Contact. For legal matters related to these Terms and Conditions, the client may write to legal@qlctrade.net. For customer support: soporte@qlctrade.net."
    },
    "terms_title": {
      "value": "Términos y Condiciones del Servicio de Copytrading",
      "valueEn": "Copy Trading Service Terms and Conditions"
    }
  },
  "microposiciones": {
    "lead": {
      "value": "QLC adapta una arquitectura de trading institucional a cuentas individuales mediante una metodología basada en microposiciones y ejecución sistemática.",
      "valueEn": "QLC adapts an institutional trading architecture to individual accounts through a methodology based on micro-positions and systematic execution."
    },
    "range": {
      "value": "100 – 2,000 USDT",
      "valueEn": "100 – 2,000 USDT"
    }
  },
  "modelo": {
    "h2_line1": {
      "value": "Copytrading institucional.",
      "valueEn": "Institutional copytrading."
    },
    "h2_line2": {
      "value": "Sin salir de tu cuenta.",
      "valueEn": "Without leaving your account."
    },
    "intro": {
      "value": "La estrategia de QLC se ejecuta directamente sobre la cuenta del cliente mediante una conexión API. El capital permanece en su propia cuenta de exchange.",
      "valueEn": "QLC's strategy is executed directly on the client's account through an API connection. The capital stays in their own exchange account."
    },
    "kicker": {
      "value": "EL CONCEPTO",
      "valueEn": "THE CONCEPT"
    }
  },
  "modelos": {
    "note": {
      "value": "Las referencias de rendimiento son objetivos o parámetros del modelo y no constituyen una garantía de resultados futuros.",
      "valueEn": "Performance references are targets or model parameters and do not constitute a guarantee of future results."
    }
  },
  "problema": {
    "body_1": {
      "value": "La mayoría de los traders minoristas enfrenta los mercados con herramientas limitadas: gráficos, indicadores y líneas en una pantalla, intentando anticipar si el precio subirá o bajará.",
      "valueEn": "Most retail traders face the markets with limited tools: charts, indicators and lines on a screen, trying to anticipate whether the price will rise or fall."
    },
    "body_2": {
      "value": "Mientras tanto, el entorno profesional utiliza modelos cuantitativos, algoritmos, software especializado y herramientas de análisis de última generación, desarrolladas para procesar información y ejecutar estrategias con una capacidad que un operador humano no puede igualar.",
      "valueEn": "Meanwhile, the professional environment uses quantitative models, algorithms, specialized software and state-of-the-art analysis tools, built to process information and execute strategies with a capacity no human operator can match."
    },
    "body_3": {
      "value": "El problema no siempre es la estrategia. Es la infraestructura disponible para ejecutarla.",
      "valueEn": "The problem isn't always the strategy. It's the infrastructure available to execute it."
    },
    "body_4": {
      "value": "QLC cambia esa ecuación.",
      "valueEn": "QLC changes that equation."
    },
    "body_5": {
      "value": "Ponemos al alcance de inversores individuales una infraestructura de Copytrading Institucional, basada en nuestra propia estrategia, tecnología y sistemas de ejecución.",
      "valueEn": "We put an institutional Copytrading infrastructure within reach of individual investors, built on our own strategy, technology and execution systems."
    },
    "body_6": {
      "value": "Desde 100 USDT.",
      "valueEn": "Starting from 100 USDT."
    },
    "body_7": {
      "value": "Tu cuenta sigue siendo individual. Nuestra gestión es global.",
      "valueEn": "Your account remains individual. Our management is global."
    },
    "body_8": {
      "value": "Tú ves tu cuenta. Nosotros vemos tu cuenta como parte de una estructura global de miles de cuentas.",
      "valueEn": "You see your account. We see your account as part of a global structure of thousands of accounts."
    },
    "body_9": {
      "value": "La diferencia no está solamente en lo que ves en el gráfico. Está en todo lo que ocurre detrás de él.",
      "valueEn": "The difference isn't only in what you see on the chart. It's in everything that happens behind it."
    },
    "closing": {
      "value": "QLC — Infraestructura institucional. Ahora al alcance del inversor individual.",
      "valueEn": "QLC — Institutional infrastructure. Now within reach of the individual investor."
    },
    "lead": {
      "value": "El 95% pierde. El 5% opera con otra infraestructura.",
      "valueEn": "95% lose. 5% operate with a different infrastructure."
    },
    "title": {
      "value": "EL JUEGO NO ES PAREJO.",
      "valueEn": "THE GAME ISN'T LEVEL."
    }
  },
  "resultados": {
    "lead_1": {
      "value": "No te pedimos que confíes en nosotros. Te damos acceso a una referencia externa para que puedas consultar directamente en Bitget los indicadores de rendimiento del perfil.",
      "valueEn": "We do not ask you to trust us. We give you access to an external reference so you can review the profile performance indicators directly on Bitget."
    },
    "lead_2": {
      "value": "Este perfil de trading está conectado mediante API a nuestra infraestructura tecnológica.",
      "valueEn": "This trading profile is connected via API to our technology infrastructure."
    }
  },
  "seguridad": {
    "h2_line1": {
      "value": "Tu cuenta.",
      "valueEn": "Your account."
    },
    "h2_line2": {
      "value": "Tu capital. Tu control.",
      "valueEn": "Your capital. Your control."
    },
    "kicker": {
      "value": "CONTROL",
      "valueEn": "CONTROL"
    }
  },
  "sobre_qlc": {
    "body_1": {
      "value": "QLC desarrolla y opera infraestructura tecnológica especializada para conectar, coordinar y ejecutar estrategias de trading sobre cuentas individuales de sus usuarios.",
      "valueEn": "QLC develops and operates specialized technology infrastructure to connect, coordinate, and execute trading strategies on its users' individual accounts."
    },
    "body_2": {
      "value": "Nuestra función se centra en proporcionar la tecnología, los sistemas y la infraestructura necesarios para una ejecución estructurada y coordinada.",
      "valueEn": "Our role is centered on providing the technology, systems, and infrastructure needed for structured, coordinated execution."
    },
    "body_3": {
      "value": "QLC no es un banco, no es una institución financiera y no custodia los fondos de sus usuarios. Los fondos permanecen en la cuenta del propio cliente en el exchange correspondiente, bajo su titularidad y control.",
      "valueEn": "QLC is not a bank, is not a financial institution, and does not hold custody of its users' funds. Funds remain in the client's own account on the corresponding exchange, under their ownership and control."
    },
    "body_4": {
      "value": "El alcance de los servicios de QLC se limita a las funciones tecnológicas expresamente contratadas.",
      "valueEn": "The scope of QLC's services is limited to the technological functions expressly contracted."
    },
    "intro": {
      "value": "QLC es una empresa enfocada en infraestructura tecnológica para la ejecución de estrategias algorítmicas y cuantitativas aplicadas a mercados de activos digitales.",
      "valueEn": "QLC is a company focused on technology infrastructure for executing algorithmic and quantitative strategies applied to digital asset markets."
    }
  },
  "tecnologia": {
    "h2_line1": {
      "value": "Una arquitectura.",
      "valueEn": "An architecture."
    },
    "h2_line2": {
      "value": "Una experiencia sencilla.",
      "valueEn": "A simple experience."
    },
    "kicker": {
      "value": "INFRAESTRUCTURA",
      "valueEn": "INFRASTRUCTURE"
    },
    "sub": {
      "value": "La complejidad tecnológica pertenece a QLC. Para el cliente, el producto se resume en una conexión, una estrategia y una ejecución directa en su cuenta.",
      "valueEn": "The technological complexity belongs to QLC. For the client, the product comes down to a connection, a strategy, and direct execution on their account."
    }
  }
};

export default PUBLIC_CONTENT;
