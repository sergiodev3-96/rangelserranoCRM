import type { FinancingTableConfig } from "@/types/financial-entities";

export type AmortizationOption = {
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
  isRecommended: boolean;
};

export type CommercialSimulationOption = {
  termMonths: number;
  tinRate: number;
  coefWithoutInsurance: number;
  coefWithInsurance: number;
  monthlyPayment: number;       // Cuota: Precio Vehiculo * Coeficiente sin seguro
  insuranceMonthly: number;     // Seguro: (Precio Vehiculo * Coeficiente con seguro) - (Precio Vehiculo * Coeficiente sin seguro)
  totalPayableMonthly: number;  // Cuota Total: Cuota Mensual + Seguro = Precio Vehiculo * Coeficiente con seguro
  totalInterest: number;
  totalPayable: number;
  isRecommended: boolean;
};

// Tabla comercial por defecto basada en los coeficientes bancarios estándar (ej. Santander Consumer, BBVA)
export const DEFAULT_COMMERCIAL_TABLE: FinancingTableConfig = {
  terms: [12, 24, 36, 48, 60, 72, 84, 96, 108, 120],
  rows: [
    {
      tin: 8.50,
      coefficients: {
        "36": { without_insurance: 0.032814, with_insurance: 0.033557 },
        "48": { without_insurance: 0.025622, with_insurance: 0.026442 },
        "60": { without_insurance: 0.021327, with_insurance: 0.022237 },
        "72": { without_insurance: 0.018481, with_insurance: 0.019492 },
        "84": { without_insurance: 0.016462, with_insurance: 0.017588 },
        "96": { without_insurance: 0.014961, with_insurance: 0.016216 },
        "108": { without_insurance: 0.013804, with_insurance: 0.015205 },
        "120": { without_insurance: 0.012888, with_insurance: 0.014453 },
      },
    },
    {
      tin: 8.99,
      coefficients: {
        "36": { without_insurance: 0.033051, with_insurance: 0.033799 },
        "48": { without_insurance: 0.025863, with_insurance: 0.026691 },
        "60": { without_insurance: 0.021573, with_insurance: 0.022494 },
        "72": { without_insurance: 0.018732, with_insurance: 0.019758 },
        "84": { without_insurance: 0.016719, with_insurance: 0.017863 },
        "96": { without_insurance: 0.015223, with_insurance: 0.016501 },
        "108": { without_insurance: 0.014072, with_insurance: 0.015500 },
        "120": { without_insurance: 0.013162, with_insurance: 0.014760 },
      },
    },
    {
      tin: 9.50,
      coefficients: {
        "36": { without_insurance: 0.033298, with_insurance: 0.034052 },
        "48": { without_insurance: 0.026116, with_insurance: 0.026951 },
        "60": { without_insurance: 0.021831, with_insurance: 0.022763 },
        "72": { without_insurance: 0.018997, with_insurance: 0.020037 },
        "84": { without_insurance: 0.016990, with_insurance: 0.018152 },
        "96": { without_insurance: 0.015500, with_insurance: 0.016801 },
        "108": { without_insurance: 0.014355, with_insurance: 0.015811 },
        "120": { without_insurance: 0.013451, with_insurance: 0.015084 },
      },
    },
    {
      tin: 9.99,
      coefficients: {
        "36": { without_insurance: 0.033537, with_insurance: 0.034296 },
        "48": { without_insurance: 0.026359, with_insurance: 0.027203 },
        "60": { without_insurance: 0.022081, with_insurance: 0.023023 },
        "72": { without_insurance: 0.019252, with_insurance: 0.020306 },
        "84": { without_insurance: 0.017252, with_insurance: 0.018432 },
        "96": { without_insurance: 0.015768, "with_insurance": 0.017091 },
        "108": { without_insurance: 0.014629, with_insurance: 0.016114 },
        "120": { without_insurance: 0.013731, with_insurance: 0.015398 },
      },
    },
    {
      tin: 10.50,
      coefficients: {
        "72": { without_insurance: 0.019521, with_insurance: 0.020589 },
        "84": { without_insurance: 0.017527, with_insurance: 0.018726 },
        "96": { without_insurance: 0.016050, with_insurance: 0.017397 },
        "108": { without_insurance: 0.014918, with_insurance: 0.016431 },
        "120": { without_insurance: 0.014026, with_insurance: 0.015729 },
      },
    },
  ],
};

// Tabla comercial específica para BBVA
export const DEFAULT_BBVA_COMMERCIAL_TABLE: FinancingTableConfig = {
  terms: [12, 24, 36, 48, 60, 72, 84, 96, 108, 120],
  rows: [
    {
      tin: 5.50,
      coefficients: {
        "36": { without_insurance: 0.031389, with_insurance: 0.032099 },
        "48": { without_insurance: 0.024175, with_insurance: 0.024949 },
        "60": { without_insurance: 0.019856, with_insurance: 0.020703 },
        "72": { without_insurance: 0.016983, with_insurance: 0.017913 },
        "84": { without_insurance: 0.014938, with_insurance: 0.015960 },
        "96": { without_insurance: 0.013409, with_insurance: 0.014534 },
        "108": { without_insurance: 0.012225, with_insurance: 0.013465 },
        "120": { without_insurance: 0.011281, with_insurance: 0.012651 },
      },
    },
    {
      tin: 5.99,
      coefficients: {
        "36": { without_insurance: 0.031619, with_insurance: 0.032334 },
        "48": { without_insurance: 0.024408, with_insurance: 0.025189 },
        "60": { without_insurance: 0.020092, with_insurance: 0.020949 },
        "72": { without_insurance: 0.017223, with_insurance: 0.018165 },
        "84": { without_insurance: 0.015181, with_insurance: 0.016219 },
        "96": { without_insurance: 0.013655, with_insurance: 0.014801 },
        "108": { without_insurance: 0.012475, with_insurance: 0.013741 },
        "120": { without_insurance: 0.011535, with_insurance: 0.012936 },
      },
    },
    {
      tin: 6.50,
      coefficients: {
        "36": { without_insurance: 0.031860, with_insurance: 0.032580 },
        "48": { without_insurance: 0.024652, with_insurance: 0.025441 },
        "60": { without_insurance: 0.020339, with_insurance: 0.021207 },
        "72": { without_insurance: 0.017474, with_insurance: 0.018431 },
        "84": { without_insurance: 0.015436, with_insurance: 0.016492 },
        "96": { without_insurance: 0.013915, with_insurance: 0.015083 },
        "108": { without_insurance: 0.012739, with_insurance: 0.014031 },
        "120": { without_insurance: 0.011803, with_insurance: 0.013236 },
      },
    },
    {
      tin: 6.99,
      coefficients: {
        "36": { without_insurance: 0.032092, with_insurance: 0.032818 },
        "48": { without_insurance: 0.024887, with_insurance: 0.025684 },
        "60": { without_insurance: 0.020578, with_insurance: 0.021456 },
        "72": { without_insurance: 0.017717, with_insurance: 0.018687 },
        "84": { without_insurance: 0.015684, with_insurance: 0.016757 },
        "96": { without_insurance: 0.014167, with_insurance: 0.015356 },
        "108": { without_insurance: 0.012995, with_insurance: 0.014314 },
        "120": { without_insurance: 0.012064, with_insurance: 0.013529 },
      },
    },
    {
      tin: 7.50,
      coefficients: {
        "36": { without_insurance: 0.032335, with_insurance: 0.033066 },
        "48": { without_insurance: 0.025134, with_insurance: 0.025938 },
        "60": { without_insurance: 0.020829, with_insurance: 0.021718 },
        "72": { without_insurance: 0.017973, with_insurance: 0.018957 },
        "84": { without_insurance: 0.015944, "with_insurance": 0.017035 },
        "96": { without_insurance: 0.014432, with_insurance: 0.015643 },
        "108": { without_insurance: 0.013265, with_insurance: 0.014611 },
        "120": { without_insurance: 0.012339, with_insurance: 0.013837 },
      },
    },
    {
      tin: 7.99,
      coefficients: {
        "36": { without_insurance: 0.032569, with_insurance: 0.033306 },
        "48": { without_insurance: 0.025372, with_insurance: 0.026184 },
        "60": { without_insurance: 0.021072, with_insurance: 0.021971 },
        "72": { without_insurance: 0.018221, with_insurance: 0.019218 },
        "84": { without_insurance: 0.016197, with_insurance: 0.017305 },
        "96": { without_insurance: 0.014690, with_insurance: 0.015923 },
        "108": { without_insurance: 0.013528, with_insurance: 0.014900 },
        "120": { without_insurance: 0.012607, with_insurance: 0.014137 },
      },
    },
    {
      tin: 8.50,
      coefficients: {
        "36": { without_insurance: 0.032814, with_insurance: 0.033557 },
        "48": { without_insurance: 0.025622, with_insurance: 0.026442 },
        "60": { without_insurance: 0.021327, with_insurance: 0.022237 },
        "72": { without_insurance: 0.018481, with_insurance: 0.019492 },
        "84": { without_insurance: 0.016462, with_insurance: 0.017588 },
        "96": { without_insurance: 0.014961, with_insurance: 0.016216 },
        "108": { without_insurance: 0.013804, with_insurance: 0.015205 },
        "120": { without_insurance: 0.012888, with_insurance: 0.014453 },
      },
    },
    {
      tin: 8.99,
      coefficients: {
        "36": { without_insurance: 0.033051, with_insurance: 0.033799 },
        "48": { without_insurance: 0.025863, with_insurance: 0.026691 },
        "60": { without_insurance: 0.021573, with_insurance: 0.022494 },
        "72": { without_insurance: 0.018732, with_insurance: 0.019758 },
        "84": { without_insurance: 0.016719, with_insurance: 0.017863 },
        "96": { without_insurance: 0.015223, with_insurance: 0.016501 },
        "108": { without_insurance: 0.014072, with_insurance: 0.015500 },
        "120": { without_insurance: 0.013162, with_insurance: 0.014760 },
      },
    },
    {
      tin: 9.50,
      coefficients: {
        "36": { without_insurance: 0.033298, with_insurance: 0.034052 },
        "48": { without_insurance: 0.026116, with_insurance: 0.026951 },
        "60": { without_insurance: 0.021831, with_insurance: 0.022763 },
        "72": { without_insurance: 0.018997, with_insurance: 0.020037 },
        "84": { without_insurance: 0.016990, with_insurance: 0.018152 },
        "96": { without_insurance: 0.015500, with_insurance: 0.016801 },
        "108": { without_insurance: 0.014355, with_insurance: 0.015811 },
        "120": { without_insurance: 0.013451, with_insurance: 0.015084 },
      },
    },
    {
      tin: 9.99,
      coefficients: {
        "36": { without_insurance: 0.033537, with_insurance: 0.034296 },
        "48": { without_insurance: 0.026359, with_insurance: 0.027203 },
        "60": { without_insurance: 0.022081, with_insurance: 0.023023 },
        "72": { without_insurance: 0.019252, with_insurance: 0.020306 },
        "84": { without_insurance: 0.017252, with_insurance: 0.018432 },
        "96": { without_insurance: 0.015768, "with_insurance": 0.017091 },
        "108": { without_insurance: 0.014629, with_insurance: 0.016114 },
        "120": { without_insurance: 0.013731, with_insurance: 0.015398 },
      },
    },
    {
      tin: 10.50,
      coefficients: {
        "72": { without_insurance: 0.019521, with_insurance: 0.020589 },
        "84": { without_insurance: 0.017527, with_insurance: 0.018726 },
        "96": { without_insurance: 0.016050, with_insurance: 0.017397 },
        "108": { without_insurance: 0.014918, with_insurance: 0.016431 },
        "120": { without_insurance: 0.014026, with_insurance: 0.015729 },
      },
    },
  ],
};

// Cálculo comercial por coeficientes según la tabla bancaria
export function calculateCommercialSimulation(
  vehiclePrice: number,
  downPayment: number,
  tableConfig?: FinancingTableConfig | null,
  filterTin?: number | null
): {
  financedCapital: number;
  options: CommercialSimulationOption[];
} {
  const financedCapital = Math.max(0, vehiclePrice - downPayment);
  const baseAmount = financedCapital;

  const table = tableConfig && tableConfig.rows && tableConfig.rows.length > 0
    ? tableConfig
    : DEFAULT_COMMERCIAL_TABLE;

  const options: CommercialSimulationOption[] = [];

  // Filtrar filas por TIN si se ha seleccionado uno específico
  const rowsToProcess = (typeof filterTin === "number" && filterTin > 0)
    ? table.rows.filter((r) => Math.abs(r.tin - filterTin) < 0.001)
    : table.rows;

  rowsToProcess.forEach((row) => {
    table.terms.forEach((term) => {
      const termKey = String(term);
      const cell = row.coefficients?.[termKey];
      if (!cell) return;

      const withoutInsurance = cell.without_insurance;
      const withInsurance = cell.with_insurance;

      // Al menos uno de los coeficientes debe ser numérico mayor a cero
      if (
        (withoutInsurance === null || withoutInsurance === undefined || withoutInsurance <= 0) &&
        (withInsurance === null || withInsurance === undefined || withInsurance <= 0)
      ) {
        return;
      }

      const coefSin = withoutInsurance ?? withInsurance ?? 0;
      const coefCon = withInsurance ?? withoutInsurance ?? 0;

      // Cuota: Precio Vehiculo * Coeficiente sin seguro
      const monthlyPayment = parseFloat((baseAmount * coefSin).toFixed(2));

      // Seguro: (Precio Vehiculo * Coeficiente con seguro) - (Precio Vehiculo * Coeficiente sin seguro)
      const rawInsurance = (baseAmount * coefCon) - (baseAmount * coefSin);
      const insuranceMonthly = parseFloat(Math.max(0, rawInsurance).toFixed(2));

      // Cuota Total: cuota mensual + seguro
      const totalPayableMonthly = parseFloat((monthlyPayment + insuranceMonthly).toFixed(2));

      const totalPayable = parseFloat((totalPayableMonthly * term).toFixed(2));
      const totalInterest = parseFloat(Math.max(0, (monthlyPayment * term) - baseAmount).toFixed(2));

      options.push({
        termMonths: term,
        tinRate: row.tin,
        coefWithoutInsurance: coefSin,
        coefWithInsurance: coefCon,
        monthlyPayment,
        insuranceMonthly,
        totalPayableMonthly,
        totalInterest,
        totalPayable,
        isRecommended: term === 84,
      });
    });
  });

  // Ordenar opciones: primero por TIN, luego por Plazo
  options.sort((a, b) => {
    if (a.tinRate !== b.tinRate) return a.tinRate - b.tinRate;
    return a.termMonths - b.termMonths;
  });

  return {
    financedCapital,
    options,
  };
}

// Compatibilidad con la fórmula estándar clásica
export function calculateAmortization(
  vehiclePrice: number,
  downPayment: number,
  tinRate: number
): {
  financedCapital: number;
  taeRate: number;
  options: AmortizationOption[];
} {
  const financedCapital = Math.max(0, vehiclePrice - downPayment);
  const taeRate = tinRate + 0.3;
  const terms = [60, 72, 84, 96, 108, 120];

  const options = terms.map((term) => {
    const monthlyRate = (tinRate / 100) / 12;
    let monthlyPayment = 0;

    if (financedCapital <= 0) {
      monthlyPayment = 0;
    } else if (monthlyRate === 0) {
      monthlyPayment = financedCapital / term;
    } else {
      monthlyPayment =
        (financedCapital * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -term));
    }

    const totalPayable = monthlyPayment * term;
    const totalInterest = Math.max(0, totalPayable - financedCapital);

    return {
      termMonths: term,
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      totalPayable: parseFloat(totalPayable.toFixed(2)),
      isRecommended: term === 84,
    };
  });

  return {
    financedCapital,
    taeRate: parseFloat(taeRate.toFixed(2)),
    options,
  };
}
