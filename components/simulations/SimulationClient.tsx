"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateAmortization } from "@/lib/finance/calculator";
import { createSimulation } from "@/lib/actions/simulations";
import type { CreateSimulationInput } from "@/lib/validations/simulations";

type LeadSummary = {
  id: string;
  full_name: string;
};

type SimulationClientProps = {
  leads: LeadSummary[];
  initialLeadId?: string | null;
};

const ENTITIES_CONFIG = [
  { name: "Santander Consumer", tin: 6.49 },
  { name: "BBVA", tin: 5.99 },
  { name: "Cetelem Auto", tin: 7.15 },
  { name: "Personalizado", tin: 0 },
];

export default function SimulationClient({
  leads,
  initialLeadId,
}: SimulationClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Input states
  const [vehiclePrice, setVehiclePrice] = useState<number>(32500);
  const [downPayment, setDownPayment] = useState<number>(6500);
  const [entityIndex, setEntityIndex] = useState<number>(0); // Default to Santander
  const [customTin, setCustomTin] = useState<number>(6.5);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeadId || "");
  const [selectedTerm, setSelectedTerm] = useState<number>(84); // Default to 84 months (recommended)

  // Feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync selectedLeadId if initialLeadId changes
  useEffect(() => {
    if (initialLeadId) {
      setSelectedLeadId(initialLeadId);
    }
  }, [initialLeadId]);

  // Derived values
  const currentEntity = ENTITIES_CONFIG[entityIndex];
  const tinRate = currentEntity.name === "Personalizado" ? customTin : currentEntity.tin;

  const { financedCapital, taeRate, options } = calculateAmortization(
    vehiclePrice,
    downPayment,
    tinRate
  );

  // Validate initial deposit (min 10%)
  const minDeposit = vehiclePrice * 0.1;
  const isDepositValid = downPayment >= minDeposit;
  const depositPercent = vehiclePrice > 0 ? Math.round((downPayment / vehiclePrice) * 100) : 0;

  // Selected option details
  const selectedOption = options.find((o) => o.termMonths === selectedTerm) || options[2]; // Fallback to 84m

  const handleSave = () => {
    if (!isDepositValid) {
      setErrorMsg("El depósito inicial debe ser de al menos el 10% del valor del vehículo.");
      return;
    }
    if (financedCapital <= 0) {
      setErrorMsg("El capital financiado debe ser mayor a 0.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const input: CreateSimulationInput = {
        lead_id: selectedLeadId || null,
        vehicle_price: vehiclePrice,
        down_payment: downPayment,
        financed_capital: financedCapital,
        entity_name: currentEntity.name === "Personalizado" ? "Personalizado" : currentEntity.name,
        tin_rate: tinRate,
        tae_rate: taeRate,
        term_months: selectedTerm,
        monthly_payment: selectedOption.monthlyPayment,
        total_interest: selectedOption.totalInterest,
        total_payable: selectedOption.totalPayable,
        is_draft: !selectedLeadId, // If lead selected, not draft. Otherwise, draft.
      };

      const result = await createSimulation(input);

      if (result.success) {
        setSuccessMsg(
          selectedLeadId
            ? "Simulación guardada y vinculada al lead con éxito."
            : "Simulación libre guardada con éxito."
        );
        // If linked to lead, go back to lead details after 1.5 seconds
        if (selectedLeadId) {
          setTimeout(() => {
            router.push(`/leads/${selectedLeadId}`);
            router.refresh();
          }, 1500);
        }
      } else {
        setErrorMsg(result.error || "No se pudo guardar la simulación.");
      }
    });
  };

  return (
    <div className="p-6 space-y-6 text-left bg-bg-base text-text-primary">
      {/* Title */}
      <div>
        <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
          Simulador Financiero
        </h1>
        <p className="font-body-sm text-[13px] text-text-secondary">
          Configura los parámetros para cotizar opciones de financiación y guardarlas en el CRM.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto items-start">
        
        {/* Left Form: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card-lead border border-border-default rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500 pointer-events-none"></div>
            
            <h3 className="text-[17px] font-medium text-text-primary mb-4 flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary text-xl">settings_applications</span>
              Parámetros de Entrada
            </h3>

            <div className="space-y-4">
              {/* Lead Association */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                  Vincular a Lead (Opcional)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[18px]">
                    person
                  </span>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-10 pr-8 text-[13px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Simulación Libre (Borrador)</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                  Precio del Vehículo (€)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[18px]">
                    euro
                  </span>
                  <input
                    type="number"
                    value={vehiclePrice || ""}
                    onChange={(e) => setVehiclePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-10 pr-3 font-data-mono text-[14px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-right"
                  />
                </div>
              </div>

              {/* Initial deposit */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                  Entrada Inicial (€)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[18px]">
                    payments
                  </span>
                  <input
                    type="number"
                    value={downPayment || ""}
                    onChange={(e) => setDownPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-10 pr-3 font-data-mono text-[14px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-right"
                  />
                </div>
                <div className="mt-1 flex justify-between items-center text-[11px] text-text-tertiary">
                  <span>Mínimo 10% req. ({minDeposit.toLocaleString()} €)</span>
                  <span className={isDepositValid ? "text-success" : "text-danger"}>
                    {depositPercent}% seleccionada
                  </span>
                </div>
              </div>

              {/* Financing entity */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                  Entidad Financiera (Tasa)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[18px]">
                    account_balance
                  </span>
                  <select
                    value={entityIndex}
                    onChange={(e) => setEntityIndex(parseInt(e.target.value))}
                    className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-10 pr-8 text-[13px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                  >
                    {ENTITIES_CONFIG.map((ent, idx) => (
                      <option key={ent.name} value={idx}>
                        {ent.name} {ent.tin > 0 ? `(TIN ${ent.tin}%)` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Custom TIN (Shown only when 'Personalizado' selected) */}
              {currentEntity.name === "Personalizado" && (
                <div className="space-y-1 transition-all duration-300">
                  <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                    TIN Personalizado (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customTin || ""}
                    onChange={(e) => setCustomTin(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-bg-input border border-border-default rounded-lg py-2 px-3 font-data-mono text-[14px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-right"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-bg-elevated/80 backdrop-blur-md border border-border-subtle rounded-xl p-5 flex flex-col gap-4">
            <div>
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider block select-none">
                Capital Financiado
              </span>
              <div className="text-[28px] font-bold text-text-primary mt-1 font-data-mono tracking-tight">
                {financedCapital.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 bg-surface-container-low rounded-lg p-3 border border-border-default select-none">
                <span className="text-[11px] text-text-secondary">TIN</span>
                <div className="text-[15px] text-text-primary font-data-mono font-medium mt-0.5">
                  {tinRate.toFixed(2)}%
                </div>
              </div>
              <div className="flex-1 bg-surface-container-low rounded-lg p-3 border border-border-default relative overflow-hidden select-none">
                <div className="absolute top-0 right-0 w-1 h-full bg-warning"></div>
                <span className="text-[11px] text-text-secondary">
                  TAE <span className="text-text-tertiary">(+0.3%)</span>
                </span>
                <div className="text-[15px] text-warning font-data-mono font-medium mt-0.5">
                  {taeRate.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-border-subtle select-none">
              <div className="flex justify-between items-end">
                <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                  Total Intereses ({selectedTerm} meses)
                </span>
                <span className="text-[17px] font-semibold text-danger font-data-mono">
                  {selectedOption.totalInterest.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Formula */}
          <div className="bg-surface-container-lowest border border-border-default border-dashed rounded-lg p-4 flex items-center justify-center select-none">
            <div className="font-data-mono text-text-secondary text-xs tracking-wider opacity-60">
              PMT = P × (r / n) / [1 - (1 + r/n)<sup>-nt</sup>]
            </div>
          </div>
        </div>

        {/* Right Content: Results */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex justify-between items-end mb-2 select-none">
            <h3 className="text-[17px] font-medium text-text-primary">Opciones de Amortización</h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(108,99,255,0.6)]"></span>
              <span className="text-[11px] text-text-secondary">Plazo Recomendado</span>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt) => {
              const isSelected = selectedTerm === opt.termMonths;
              
              if (opt.isRecommended) {
                // Highly visual highlighted optimal card
                return (
                  <div
                    key={opt.termMonths}
                    onClick={() => setSelectedTerm(opt.termMonths)}
                    className={`bg-surface-container-low border-2 rounded-xl p-5 shadow-[0_0_20px_rgba(108,99,255,0.1)] relative overflow-hidden md:scale-[1.02] z-10 cursor-pointer transition-all duration-300 ${
                      isSelected ? "border-primary shadow-[0_0_20px_rgba(108,99,255,0.3)]" : "border-primary/40 hover:border-primary"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                    <div className="absolute top-0 right-0 bg-primary text-on-primary text-[11px] px-3 py-1 rounded-bl-lg font-medium select-none">
                      Optimal Mix
                    </div>
                    <div className="flex justify-between items-center mb-3 relative z-10 select-none">
                      <div className="text-[15px] text-primary font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        {opt.termMonths} Meses
                      </div>
                      <div className="text-[11px] text-text-secondary px-2 py-0.5 bg-surface-container rounded-full">
                        {opt.termMonths / 12} Años
                      </div>
                    </div>
                    <div className="text-[28px] font-bold text-text-primary font-data-mono mb-4 relative z-10">
                      {opt.monthlyPayment.toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                      <span className="text-[15px] text-text-secondary font-body-base font-normal">/mes</span>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-3 space-y-2 relative z-10 select-none">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">Capital</span>
                        <span className="font-data-mono text-text-primary">
                          {financedCapital.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">Total Intereses</span>
                        <span className="font-data-mono text-danger">
                          {opt.totalInterest.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                        </span>
                      </div>
                      <div className="border-t border-border-default pt-2 flex justify-between text-xs font-medium">
                        <span className="text-text-primary">Total a Pagar</span>
                        <span className="font-data-mono text-text-primary">
                          {opt.totalPayable.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Standard card
              return (
                <div
                  key={opt.termMonths}
                  onClick={() => setSelectedTerm(opt.termMonths)}
                  className={`bg-surface-container border rounded-xl p-4 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary ring-1 ring-primary bg-surface-container-high"
                      : "border-border-default hover:border-border-strong"
                  }`}
                >
                  <div className="flex justify-between items-center mb-3 select-none">
                    <div className="text-[15px] text-text-primary font-medium">{opt.termMonths} Meses</div>
                    <div className="text-[11px] text-text-secondary px-2 py-0.5 bg-surface-container-high rounded-full">
                      {opt.termMonths / 12} Años
                    </div>
                  </div>
                  <div className="text-[24px] font-bold text-text-primary font-data-mono mb-3">
                    {opt.monthlyPayment.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                    })}
                    <span className="text-[13px] text-text-secondary font-body-base font-normal">/mes</span>
                  </div>
                  <div className="flex justify-between text-xs font-data-mono text-text-tertiary select-none">
                    <span>Int: {opt.totalInterest.toLocaleString("es-ES")} €</span>
                    <span>Total: {opt.totalPayable.toLocaleString("es-ES")} €</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Alert Message */}
          {errorMsg && (
            <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-4 font-body-sm text-[13px] mt-4">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-success/10 border border-success/20 text-success rounded-lg p-4 font-body-sm text-[13px] mt-4">
              {successMsg}
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                router.back();
              }}
              className="px-5 py-2.5 border border-border-default text-text-secondary hover:text-text-primary rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending || !isDepositValid}
              className="bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] disabled:opacity-50 disabled:hover:shadow-none transition-all duration-300 rounded-lg py-2.5 px-6 flex items-center justify-center gap-2 font-body-sm font-medium text-[13px] cursor-pointer"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  {selectedLeadId ? "Guardar y Vincular al Lead" : "Guardar Simulación Libre"}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
