export type FinancingCoefficientCell = {
  without_insurance?: number | null;
  with_insurance?: number | null;
};

export type FinancingTableRow = {
  tin: number;
  coefficients: Record<string, FinancingCoefficientCell>;
};

export type FinancingTableConfig = {
  terms: number[];
  rows: FinancingTableRow[];
};

export type FinancialEntity = {
  id: string;
  name: string;
  tin: number;
  is_active: boolean;
  sort_order: number;
  is_default: boolean;
  financing_table?: FinancingTableConfig | null;
  created_at: string;
  updated_at: string;
};
