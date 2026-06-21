export type Simulation = {
  id: string;
  lead_id: string | null;
  created_by: string;
  vehicle_price: number;
  down_payment: number;
  financed_capital: number;
  entity_name: string;
  tin_rate: number;
  tae_rate: number;
  term_months: number;
  monthly_payment: number;
  total_interest: number;
  total_payable: number;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
};
