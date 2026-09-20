export type TemplateId = "reserva_venta" | "garantia_delegada" | "contrato_compraventa";

export type ReservaContent = {
  title: string;
  seller_name: string;
  seller_cif: string;
  seller_address: string;
  seller_iban: string;
  default_amount: number;
  validity_hours: number;
  conditions: string[];
};

export type GarantiaContent = {
  title: string;
  city: string;
  seller_name: string;
  seller_cif: string;
  seller_address: string;
  general_conditions: string[];
  exclusions: string[];
  parts_clause: string;
};

export type ContratoContent = {
  title: string;
  city: string;
  seller_name: string;
  seller_cif: string;
  seller_address: string;
  clauses: string[];
  exclusions: string[];
  legal_notes: string[];
  gdpr_clause: string;
  jurisdiction: string;
};

export type TemplateContent = ReservaContent | GarantiaContent | ContratoContent;

export type DocumentTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  content: TemplateContent;
  updated_at?: string;
};

export const DEFAULT_TEMPLATES: Record<TemplateId, DocumentTemplate> = {
  reserva_venta: {
    id: "reserva_venta",
    name: "Reserva de Compra de Vehículo",
    description: "Documento oficial de formalización de reserva y señal económica para compraventa.",
    content: {
      title: "RESERVA DE COMPRA DE VEHÍCULO",
      seller_name: "RANGEL & SERRANO, S.L.",
      seller_cif: "B90210014",
      seller_address: "C/ Juan Díaz de Solís, 24A. (41010-Sevilla)",
      seller_iban: "ES42 0182 6647 2801 0150 7654",
      default_amount: 500,
      validity_hours: 48,
      conditions: [
        "EL COMPRADOR conoce y acepta el estado actual del vehículo en cuanto a su estado, kilometraje, tiempo de matriculación y garantía.",
        "EL VENDEDOR se compromete a no ofrecer ni vender el vehículo reservado a terceros durante el plazo de 48 horas a contar a partir de la fecha de reserva indicada. Si durante dicho plazo no se formalizase la compra del vehículo por desistimiento por parte de EL COMPRADOR, éste perderá la cantidad entregada."
      ]
    }
  },
  garantia_delegada: {
    id: "garantia_delegada",
    name: "Garantía Comercial Delegada",
    description: "Certificado de garantía comercial delegada de vehículo seminuevo.",
    content: {
      title: "CERTIFICADO DE GARANTÍA COMERCIAL DELEGADA DE VEHÍCULO SEMINUEVO",
      city: "Málaga",
      seller_name: "Rangel & Serrano, S.L.",
      seller_cif: "B90210014",
      seller_address: "C/ Juan Díaz de Solís, 24 - Sevilla",
      general_conditions: [
        "El Vehículo dispone de garantía comercial oficial del fabricante vigente hasta la fecha estipulada. Rangel & Serrano, S.L. no se hará cargo de las reparaciones en garantía del Vehículo mientras esté vigente la garantía del fabricante y el Comprador podrá dirigirse directamente a los servicios oficiales de la marca hasta dicha fecha.",
        "En caso de que el periodo de garantía del fabricante fuese menor a 12 meses desde la firma de este documento, se pacta de común acuerdo que Rangel & Serrano se hará cargo de las reparaciones según el Real Decreto-Ley 7/2021 hasta que se cumplan 12 meses desde la firma de este documento (excepto en los casos estipulados en las exclusiones). Estas reparaciones se realizarán en taller autorizado por Rangel & Serrano, S.L.",
        "En los casos descritos en el párrafo anterior, podrá entrar en vigor una garantía contratada específicamente por RANGEL & SERRANO, S.L. con empresa especializada del sector para el vehículo objeto del presente documento. En dichos casos, el Comprador podrá dirigirse directamente a dicha empresa.",
        "En caso de ser necesario hacer uso de la garantía, el desplazamiento del Vehículo al taller es a cuenta y cargo del Comprador.",
        "Esta garantía se entrega como cobertura adicional a los derechos legales del consumidor, que continúan siendo responsabilidad del vendedor, conforme a la normativa vigente."
      ],
      exclusions: [
        "a) Operaciones de mantenimiento y consumo: cambios de aceite, filtros, correas, líquidos, neumáticos, luces, amortiguadores, frenos, etc.",
        "b) Reparaciones de pintura, carrocería, óxido, chasis, tapizados, guarnecidos, juntas, mobiliario interior y elementos externos.",
        "c) Daños provocados por fuerza mayor, inundaciones, heladas, robo o intentos de robo, accidentes de circulación, golpes, guerra, terrorismo, u otras circunstancias no imputables al Proveedor de la garantía comercial.",
        "d) Malas reparaciones realizadas por el Comprador o terceras personas, o por negligencia intencionada del Comprador.",
        "e) Reparaciones como consecuencia de no haber realizado el plan de mantenimiento recomendado por el fabricante y/o Rangel & Serrano, S.L., así como las ocurridas por transformaciones o modificaciones en el vehículo.",
        "f) Averías de piezas garantizadas causadas por el desgaste de otras piezas no garantizadas.",
        "g) Ruidos, vibraciones, desajustes u holguras que no impliquen una avería mecánica.",
        "h) Ruidos de viento, entrada de agua, condensación o equivocación de combustible.",
        "i) Lunas y cristales.",
        "j) Daños conocidos por el Comprador al momento de la compra, incluyendo daños estéticos que influyeron en el precio del Vehículo.",
        "k) Degradación natural de la capacidad de la batería mientras no presente fallos.",
        "l) Si el Vehículo es destinado a rent a car, taxi o VTC, se pacta de común acuerdo que el Vehículo no tendrá garantía (salvo que la otorgue el fabricante)."
      ],
      parts_clause: "Para la reparación de una falta de conformidad, se podrán utilizar piezas reacondicionadas o usadas. Solo se cubrirá una avería de una misma pieza, salvo si esta es producida por una mala reparación o defecto de fabricación."
    }
  },
  contrato_compraventa: {
    id: "contrato_compraventa",
    name: "Contrato de Compraventa y Garantía",
    description: "Contrato completo de compraventa y garantía de vehículo usado.",
    content: {
      title: "CONTRATO DE COMPRAVENTA Y GARANTÍA DE VEHÍCULO USADO",
      city: "Benalmádena",
      seller_name: "Rangel & Serrano, S.L.",
      seller_cif: "B90210014",
      seller_address: "C/ Juan Díaz de Solís, 24A, 41010, Sevilla",
      clauses: [
        "El precio del vehículo, teniendo en cuenta su condición de bien usado, características y estado, los cuales han sido clave para determinar su precio, se pacta de común acuerdo en la cantidad indicada en la ficha, con transferencia, garantía e IVA incluido.",
        "Forma de pago: La cantidad convenida como señal/reserva mediante tarjeta de crédito/débito o transferencia, y el importe restante mediante transferencia bancaria o financiación.",
        "El Comprador facilita los documentos necesarios al Vendedor para que este realice el cambio de titularidad del Vehículo. El Vendedor queda autorizado a ceder estos documentos a quien corresponda para realizar dicho trámite.",
        "El Vendedor manifiesta que el Vehículo se encuentra libre de cargas o gravámenes.",
        "El Comprador acepta la compra y se hace cargo del Vehículo como cuerpo cierto desde este momento, asumiendo cuantas responsabilidades y gravámenes puedan derivarse de su uso o posesión. Asimismo, autoriza al Vendedor a facilitar sus datos personales a la autoridad correspondiente en caso de producirse alguna multa con fecha posterior a este contrato.",
        "El Comprador manifiesta que está debidamente informado, conoce y acepta las características, estado y condición del vehículo, el cual recibe a su entera satisfacción. Asimismo, manifiesta haber tenido posibilidad o haber probado el mismo.",
        "Este contrato y las piezas cubiertas en garantía se rigen por el Real Decreto-Ley 7/2021.",
        "El Comprador debe realizar el mantenimiento preconizado por el fabricante para mantener la garantía en vigor."
      ],
      exclusions: [
        "a - Operaciones de mantenimiento y consumo, tales como cambio de aceite, filtros, correas, líquidos, neumáticos, luces, amortiguación, frenos...",
        "b - Reparaciones de pintura, carrocería, óxido, chasis, tapizados, guarnecidos, juntas, mobiliario interior y elementos externos.",
        "c - Reparaciones como consecuencia de daños provocados por causa de fuerza mayor, inundaciones, heladas, robo, accidentes o golpes no imputables al vendedor.",
        "d - Reparaciones por malas intervenciones del Comprador, falta intencionada o participación en competiciones.",
        "e - Reparaciones derivadas de no realizar el plan de mantenimiento recomendado por el fabricante o por modificaciones no homologadas.",
        "f - Avería de piezas garantizadas como consecuencia de rotura o desgaste de piezas no garantizadas.",
        "g - Vibraciones o ruidos provocados por desajustes u holguras, salvo avería mecánica demostrable.",
        "h - Ruidos de viento, entradas de agua, condensación o equivocación de combustible. Lunas y cristales.",
        "i - Daños conocidos y estéticos observados en el momento de la compraventa que influyeron en el precio acordado.",
        "j - Capacidad de carga o degradación natural de la batería."
      ],
      legal_notes: [
        "El derecho a indemnización quedará limitado por el valor venal del Vehículo en la aparición de la falta de conformidad. Si los gastos de reparación superan el valor venal, este derecho quedará limitado al valor venal menos el valor de los restos. No se podrá exigir la sustitución del Vehículo ni formas desproporcionadas teniendo en cuenta su valor venal.",
        "El plazo máximo para comunicar una avería es de un mes desde su manifestación.",
        "El Vehículo se vende sin seguro de responsabilidad civil obligatoria en vigor para la circulación posterior a la entrega."
      ],
      gdpr_clause: "En cumplimiento del RGPD (UE) 2016/679 y la LOPDGDD 3/2018, le informamos que los datos facilitados serán tratados por el Vendedor con la finalidad de gestionar la compraventa, facturación y cambio de titularidad. Puede ejercer sus derechos de acceso, rectificación, supresión y demás reconocidos dirigiéndose al domicilio del Vendedor.",
      jurisdiction: "Las partes, con renuncia expresa a su propio fuero si fuese legalmente disponible, acuerdan que las controversias de este contrato serán resueltas por los Tribunales y Juzgados del domicilio del Vendedor de conformidad con las leyes españolas."
    }
  }
};
