export type AmortizationOption = {
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
  isRecommended: boolean;
};

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
  const taeRate = tinRate + 0.3; // standard MVP approximation

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
      isRecommended: term === 84, // 84 months is the optimal recommended term
    };
  });

  return {
    financedCapital,
    taeRate: parseFloat(taeRate.toFixed(2)),
    options,
  };
}
