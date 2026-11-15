"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  calculateCommercialSimulation,
  DEFAULT_COMMERCIAL_TABLE,
  DEFAULT_BBVA_COMMERCIAL_TABLE,
  CommercialSimulationOption,
} from "@/lib/finance/calculator";
import { createSimulation, updateSimulation } from "@/lib/actions/simulations";
import type { CreateSimulationInput } from "@/lib/validations/simulations";
import type { Simulation } from "@/types/simulations";
import type { FinancialEntity } from "@/types/financial-entities";

type LeadSummary = {
  id: string;
  full_name: string;
};

type SimulationClientProps = {
  leads: LeadSummary[];
  initialLeadId?: string | null;
  initialSimulation?: Simulation | null;
  initialEntities?: FinancialEntity[];
};

const DEFAULT_ENTITIES_FALLBACK = [
  { name: "Santander Consumer", tin: 6.49 },
  { name: "BBVA", tin: 5.99 },
  { name: "Cetelem Auto", tin: 7.15 },
];

export default function SimulationClient({
  leads,
  initialLeadId,
  initialSimulation,
  initialEntities = [],
}: SimulationClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(
    initialSimulation?.id || null
  );

  const entitiesList = React.useMemo(() => {
    const baseList =
      initialEntities && initialEntities.length > 0
        ? initialEntities.map((e) => ({
            name: e.name,
            tin: Number(e.tin),
            isDefault: Boolean(e.is_default),
            isActive: e.is_active,
            financing_table:
              e.financing_table ||
              (e.name.toUpperCase().includes("BBVA")
                ? DEFAULT_BBVA_COMMERCIAL_TABLE
                : DEFAULT_COMMERCIAL_TABLE),
          }))
        : DEFAULT_ENTITIES_FALLBACK.map((e, idx) => ({
            name: e.name,
            tin: e.tin,
            isDefault: idx === 0,
            isActive: true,
            financing_table:
              e.name.toUpperCase().includes("BBVA")
                ? DEFAULT_BBVA_COMMERCIAL_TABLE
                : DEFAULT_COMMERCIAL_TABLE,
          }));

    return [
      ...baseList,
      {
        name: "Personalizado",
        tin: 0,
        isDefault: false,
        isActive: true,
        financing_table: DEFAULT_COMMERCIAL_TABLE,
      },
    ];
  }, [initialEntities]);

  // Encontrar índice de entidad por defecto
  const defaultEntityIdx = React.useMemo(() => {
    if (initialSimulation) {
      const idx = entitiesList.findIndex((e) => e.name === initialSimulation.entity_name);
      return idx === -1 ? entitiesList.length - 1 : idx;
    }
    const defEntity = initialEntities.find((e) => e.is_default && e.is_active);
    if (defEntity) {
      const idx = entitiesList.findIndex((e) => e.name === defEntity.name);
      if (idx !== -1) return idx;
    }
    return 0;
  }, [initialSimulation, entitiesList, initialEntities]);

  // Input states
  const [vehiclePrice, setVehiclePrice] = useState<number | "">(
    initialSimulation ? Number(initialSimulation.vehicle_price) : 0
  );
  const [downPayment, setDownPayment] = useState<number | "">(
    initialSimulation ? Number(initialSimulation.down_payment) : 0
  );
  const [entityIndex, setEntityIndex] = useState<number>(defaultEntityIdx);
  const [customTin, setCustomTin] = useState<number | "">(
    initialSimulation ? Number(initialSimulation.tin_rate) : 6.5
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    initialSimulation?.lead_id || initialLeadId || ""
  );
  const [selectedTerm, setSelectedTerm] = useState<number>(
    initialSimulation ? Number(initialSimulation.term_months) : 84
  );

  // Tab de modo de seguro: "with_insurance" (Cuota con seguro) vs "without_insurance" (Cuota sin seguro)
  const [insuranceViewTab, setInsuranceViewTab] = useState<"with_insurance" | "without_insurance">("with_insurance");

  // TIN seleccionado de la tabla comercial del banco
  const [selectedTinFilter, setSelectedTinFilter] = useState<number | "all">(() => {
    if (initialSimulation) return Number(initialSimulation.tin_rate);
    const defEnt = entitiesList[defaultEntityIdx];
    return defEnt?.financing_table?.rows?.[0]?.tin || defEnt?.tin || 8.5;
  });
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>("");

  // Feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [optionsViewMode, setOptionsViewMode] = useState<"cards" | "list">("cards");

  const clearAlerts = () => {
    if (successMsg) setSuccessMsg(null);
    if (errorMsg) setErrorMsg(null);
  };

  // Sync si initialSimulation o initialLeadId cambian
  useEffect(() => {
    if (initialSimulation) {
      setCurrentSimulationId(initialSimulation.id);
      setVehiclePrice(Number(initialSimulation.vehicle_price));
      setDownPayment(Number(initialSimulation.down_payment));
      const entIdx = entitiesList.findIndex((e) => e.name === initialSimulation.entity_name);
      setEntityIndex(entIdx === -1 ? entitiesList.length - 1 : entIdx);
      setCustomTin(Number(initialSimulation.tin_rate));
      setSelectedLeadId(initialSimulation.lead_id || initialLeadId || "");
      setSelectedTerm(Number(initialSimulation.term_months));
      setSelectedTinFilter(Number(initialSimulation.tin_rate) || "all");
      setSelectedOptionKey(`${initialSimulation.term_months}-${initialSimulation.tin_rate}`);
    } else {
      setEntityIndex(defaultEntityIdx);
      const defEnt = entitiesList[defaultEntityIdx];
      const initialTin = defEnt?.financing_table?.rows?.[0]?.tin || defEnt?.tin || 8.5;
      setSelectedTinFilter(initialTin);
      if (initialLeadId) {
        setSelectedLeadId(initialLeadId);
      }
    }
  }, [initialSimulation, initialLeadId, entitiesList, defaultEntityIdx]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // Valores numéricos derivados
  const numericVehiclePrice = typeof vehiclePrice === "number" ? vehiclePrice : 0;
  const numericDownPayment = typeof downPayment === "number" ? downPayment : 0;
  const numericCustomTin = typeof customTin === "number" ? customTin : 0;

  const currentEntity = entitiesList[entityIndex] || entitiesList[0];

  // Lista de TINs disponibles en la tabla de la entidad seleccionada
  const availableTins = React.useMemo(() => {
    if (currentEntity.financing_table?.rows?.length) {
      const unique = Array.from(
        new Set(currentEntity.financing_table.rows.map((r) => r.tin))
      ).sort((a, b) => a - b);
      if (unique.length > 0) return unique;
    }
    return [currentEntity.tin || 8.5];
  }, [currentEntity]);

  const tinFilterToPass =
    currentEntity.name === "Personalizado"
      ? null
      : selectedTinFilter === "all"
      ? null
      : selectedTinFilter;

  const tableToUse =
    currentEntity.name === "Personalizado"
      ? {
          terms: [36, 48, 60, 72, 84, 96, 108, 120],
          rows: [
            {
              tin: numericCustomTin || 6.5,
              coefficients: DEFAULT_COMMERCIAL_TABLE.rows[0].coefficients,
            },
          ],
        }
      : currentEntity.financing_table;

  // Cálculo comercial por coeficientes
  const { financedCapital, options: commercialOptions } = calculateCommercialSimulation(
    numericVehiclePrice,
    numericDownPayment,
    tableToUse,
    tinFilterToPass
  );

  // Opción seleccionada actualmente
  const selectedOption: CommercialSimulationOption | null = React.useMemo(() => {
    if (commercialOptions.length === 0) return null;
    if (selectedOptionKey) {
      const found = commercialOptions.find(
        (o) => `${o.termMonths}-${o.tinRate}` === selectedOptionKey
      );
      if (found) return found;
    }
    const foundByTerm = commercialOptions.find((o) => o.termMonths === selectedTerm);
    if (foundByTerm) return foundByTerm;
    const recommended = commercialOptions.find((o) => o.isRecommended);
    return recommended || commercialOptions[0];
  }, [commercialOptions, selectedOptionKey, selectedTerm]);

  // Depósito: porcentaje y recomendación
  const minDeposit = numericVehiclePrice * 0.1;
  const isDepositRecommended = numericDownPayment >= minDeposit;
  const isValidToSave = numericVehiclePrice > 0 && numericDownPayment >= 0 && financedCapital > 0;

  // Guardar simulación
  const handleSave = () => {
    if (numericVehiclePrice <= 0) {
      setErrorMsg("El precio del vehículo debe ser mayor a 0.");
      return;
    }
    if (numericDownPayment < 0) {
      setErrorMsg("La entrada no puede ser negativa.");
      return;
    }
    if (numericDownPayment >= numericVehiclePrice) {
      setErrorMsg("La entrada no puede ser igual o superior al precio total del vehículo.");
      return;
    }
    if (financedCapital <= 0) {
      setErrorMsg("El capital financiado debe ser mayor a 0.");
      return;
    }
    if (!selectedOption) {
      setErrorMsg("Debes seleccionar una opción de financiación válida.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    // Cuota a guardar según la pestaña activa (con seguro o sin seguro)
    const monthlyPaymentToSave =
      insuranceViewTab === "with_insurance"
        ? selectedOption.totalPayableMonthly
        : selectedOption.monthlyPayment;

    startTransition(async () => {
      const input: CreateSimulationInput = {
        lead_id: selectedLeadId || null,
        vehicle_price: numericVehiclePrice,
        down_payment: numericDownPayment,
        financed_capital: financedCapital,
        entity_name: currentEntity.name === "Personalizado" ? "Personalizado" : currentEntity.name,
        tin_rate: selectedOption.tinRate,
        tae_rate: parseFloat((selectedOption.tinRate + 0.3).toFixed(2)),
        term_months: selectedOption.termMonths,
        monthly_payment: monthlyPaymentToSave,
        total_interest: selectedOption.totalInterest,
        total_payable: selectedOption.totalPayable,
        is_draft: !selectedLeadId,
      };

      let result;
      if (currentSimulationId) {
        result = await updateSimulation(currentSimulationId, input);
      } else {
        result = await createSimulation(input);
        if (result.success && result.data) {
          setCurrentSimulationId(result.data.id);
          const url = new URL(window.location.href);
          url.searchParams.set("id", result.data.id);
          if (selectedLeadId) {
            url.searchParams.set("leadId", selectedLeadId);
          }
          window.history.replaceState({}, "", url.toString());
        }
      }

      if (result.success) {
        setSuccessMsg(
          selectedLeadId
            ? "Simulación guardada y vinculada al lead con éxito."
            : "Simulación libre guardada con éxito."
        );
      } else {
        setErrorMsg(result.error || "No se pudo guardar la simulación.");
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left bg-bg-base text-text-primary md:h-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
              Simulador Financiero
            </h1>
            {currentSimulationId && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                Editando simulación
              </span>
            )}
          </div>
          <p className="font-body-sm text-[13px] text-text-secondary">
            Cálculo de cuotas comerciales mediante coeficientes bancarios (con seguro y sin seguro).
          </p>
        </div>

        {selectedLead && (
          <div className="flex items-center gap-2">
            <Link
              href={`/leads/${selectedLead.id}`}
              className="px-3 py-1.5 rounded-lg border border-border-default hover:border-primary/50 text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              Lead: <strong className="text-text-primary">{selectedLead.full_name}</strong>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        )}
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
                    onChange={(e) => {
                      setSelectedLeadId(e.target.value);
                      clearAlerts();
                    }}
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
                    min="0"
                    step="any"
                    value={vehiclePrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVehiclePrice(val === "" ? "" : Math.max(0, parseFloat(val) || 0));
                      clearAlerts();
                    }}
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
                    min="0"
                    step="any"
                    value={downPayment}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDownPayment(val === "" ? "" : Math.max(0, parseFloat(val) || 0));
                      clearAlerts();
                    }}
                    className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-10 pr-3 font-data-mono text-[14px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-right"
                  />
                </div>
                <div className="mt-1 flex justify-between items-center text-xs text-text-tertiary">
                  <span>Min. 10% recomendado</span>
                  <span className={isDepositRecommended ? "text-success font-medium" : "text-warning font-medium"}>
                    {numericVehiclePrice > 0
                      ? `${((numericDownPayment / numericVehiclePrice) * 100).toFixed(1)}% de entrada`
                      : "0.0%"}
                  </span>
                </div>
              </div>

              {/* Financing entity */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                  Entidad Financiera (Banco)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[18px]">
                    account_balance
                  </span>
                  <select
                    value={entityIndex}
                    onChange={(e) => {
                      const newIdx = parseInt(e.target.value);
                      setEntityIndex(newIdx);
                      const targetEnt = entitiesList[newIdx];
                      if (targetEnt && targetEnt.name !== "Personalizado") {
                        const targetTins = targetEnt.financing_table?.rows?.length
                          ? Array.from(new Set(targetEnt.financing_table.rows.map((r) => r.tin))).sort((a, b) => a - b)
                          : [targetEnt.tin || 8.5];
                        if (typeof selectedTinFilter === "number" && targetTins.includes(selectedTinFilter)) {
                          // Mantener el TIN actual si está disponible en la nueva entidad
                        } else {
                          setSelectedTinFilter(targetTins[0] ?? "all");
                        }
                      }
                      setSelectedOptionKey("");
                      clearAlerts();
                    }}
                    className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-10 pr-8 text-[13px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                  >
                    {entitiesList.map((ent, idx) => (
                      <option key={`${ent.name}-${idx}`} value={idx}>
                        {ent.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Selector de TIN de la Tabla Comercial del banco */}
              {currentEntity.name !== "Personalizado" && availableTins.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                      T.I.N. (%)
                    </label>
                    <span className="text-[10px] text-primary/80 font-medium">
                      Tabla de {currentEntity.name}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[18px]">
                      percent
                    </span>
                    <select
                      value={selectedTinFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTinFilter(val === "all" ? "all" : parseFloat(val));
                        setSelectedOptionKey("");
                        clearAlerts();
                      }}
                      className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-10 pr-8 text-[13px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                    >
                      {availableTins.map((t) => (
                        <option key={t} value={t}>
                          {t.toFixed(2)}% T.I.N.
                        </option>
                      ))}
                      <option value="all">Ver todos los T.I.N. ({availableTins.length} tipos disponibles)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              )}

              {/* Custom TIN (Shown only when 'Personalizado' selected) */}
              {currentEntity.name === "Personalizado" && (
                <div className="space-y-1 transition-all duration-300">
                  <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                    T.I.N. Personalizado (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customTin}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomTin(val === "" ? "" : Math.max(0, parseFloat(val) || 0));
                      clearAlerts();
                    }}
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
                <span className="text-[11px] text-text-secondary">TIN Aplicado</span>
                <div className="text-[15px] text-text-primary font-data-mono font-medium mt-0.5">
                  {selectedOption ? selectedOption.tinRate.toFixed(2) : "0.00"}%
                </div>
              </div>
              <div className="flex-1 bg-surface-container-low rounded-lg p-3 border border-border-default relative overflow-hidden select-none">
                <div className="absolute top-0 right-0 w-1 h-full bg-primary"></div>
                <span className="text-[11px] text-text-secondary">Plazo</span>
                <div className="text-[15px] text-primary font-data-mono font-bold mt-0.5">
                  {selectedOption ? `${selectedOption.termMonths} meses` : `${selectedTerm} meses`}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle select-none space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">
                  {insuranceViewTab === "with_insurance" ? "Cuota Mensual (sin seguro):" : "Cuota mensual:"}
                </span>
                <span className="font-data-mono font-bold text-text-primary">
                  {selectedOption
                    ? selectedOption.monthlyPayment.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
                    : "0,00 €"}
                </span>
              </div>
              {insuranceViewTab === "with_insurance" && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Seguro calculado:</span>
                  <span className="font-data-mono font-bold text-text-primary">
                    {selectedOption
                      ? selectedOption.insuranceMonthly.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
                      : "0,00 €"}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-border-default flex justify-between items-end">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-primary">
                  {insuranceViewTab === "with_insurance" ? "Cuota Total (con seguro):" : "Cuota mensual:"}
                </span>
                <span className="text-[18px] font-bold text-primary font-data-mono">
                  {selectedOption
                    ? (insuranceViewTab === "with_insurance"
                        ? selectedOption.totalPayableMonthly
                        : selectedOption.monthlyPayment
                      ).toLocaleString("es-ES", { style: "currency", currency: "EUR" })
                    : "0,00 €"}
                  <span className="text-xs font-normal text-text-secondary">/mes</span>
                </span>
              </div>
            </div>
          </div>

          {/* Formula Comercial Info */}
          <div className="bg-surface-container-lowest border border-border-default border-dashed rounded-lg p-3 text-center select-none space-y-1">
            <div className="font-data-mono text-text-primary text-[11px] font-semibold">
              Cuota = Financiado × Coef. sin seguro
            </div>
            <div className="font-data-mono text-text-secondary text-[10px]">
              Seguro = (Financiado × Coef. con seguro) - Cuota
            </div>
          </div>
        </div>

        {/* Right Content: Results */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Header Controls: Pestaña Con/Sin Seguro + Selector Tarjetas/Listado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 select-none">
            {/* Pestaña: Cuota con Seguro vs Cuota sin Seguro */}
            <div className="flex bg-surface-container-high/85 p-1 rounded-xl border border-border-default shrink-0">
              <button
                type="button"
                onClick={() => setInsuranceViewTab("with_insurance")}
                className={`px-4 py-2 rounded-lg font-body-sm text-[12px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  insuranceViewTab === "with_insurance"
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">verified_user</span>
                Cuota con Seguro
              </button>
              <button
                type="button"
                onClick={() => setInsuranceViewTab("without_insurance")}
                className={`px-4 py-2 rounded-lg font-body-sm text-[12px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  insuranceViewTab === "without_insurance"
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">shield</span>
                Cuota sin Seguro
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 mr-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-[11px] text-text-secondary">84 meses recomendado</span>
              </div>

              {/* View Switcher Toggle */}
              <div className="flex bg-surface-container-high/85 p-1 rounded-lg border border-border-default shrink-0 text-[12px] font-bold">
                <button
                  type="button"
                  onClick={() => setOptionsViewMode("cards")}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    optionsViewMode === "cards"
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Tarjetas
                </button>
                <button
                  type="button"
                  onClick={() => setOptionsViewMode("list")}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    optionsViewMode === "list"
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Listado
                </button>
              </div>
            </div>
          </div>

          {/* Options Grid (Tarjetas) */}
          {optionsViewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commercialOptions.map((opt) => {
                const optKey = `${opt.termMonths}-${opt.tinRate}`;
                const isSelected = selectedOptionKey
                  ? selectedOptionKey === optKey
                  : selectedTerm === opt.termMonths;
                const { isRecommended } = opt;

                const primaryMonthly =
                  insuranceViewTab === "with_insurance"
                    ? opt.totalPayableMonthly
                    : opt.monthlyPayment;

                return (
                  <div
                    key={optKey}
                    onClick={() => {
                      setSelectedOptionKey(optKey);
                      setSelectedTerm(opt.termMonths);
                      clearAlerts();
                    }}
                    className={`relative overflow-hidden rounded-xl p-5 cursor-pointer transition-all duration-300 border flex flex-col justify-between h-full ${
                      isSelected
                        ? "border-primary bg-surface-container-high ring-1 ring-primary shadow-[0_0_20px_rgba(108,99,255,0.2)]"
                        : isRecommended
                        ? "border-primary/40 bg-surface-container-low hover:border-primary"
                        : "border-border-default bg-surface-container hover:border-strong"
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-2 select-none">
                        <div className="text-[15px] text-text-primary font-bold flex items-center gap-1.5">
                          {opt.termMonths} Meses
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-primary px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
                            TIN {opt.tinRate.toFixed(2)}%
                          </span>
                          <span className="text-[11px] text-text-secondary px-2 py-0.5 bg-bg-base border border-border-default rounded-full">
                            {opt.termMonths / 12} {opt.termMonths === 12 ? "Año" : "Años"}
                          </span>
                        </div>
                      </div>

                      <div className="text-[26px] font-bold text-text-primary font-data-mono mb-3">
                        {primaryMonthly.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                        <span className="text-[13px] text-text-secondary font-body-base font-normal ml-1">
                          /mes {insuranceViewTab === "with_insurance" ? "(con seguro)" : "(sin seguro)"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest rounded-lg p-3 space-y-1.5 select-none mt-auto text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Cuota mensual:</span>
                        <span className={`font-data-mono ${insuranceViewTab === "without_insurance" ? "font-bold text-primary" : "text-text-primary"}`}>
                          {opt.monthlyPayment.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                        </span>
                      </div>
                      {insuranceViewTab === "with_insurance" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Seguro:</span>
                            <span className="font-data-mono text-text-secondary">
                              {opt.insuranceMonthly > 0
                                ? opt.insuranceMonthly.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
                                : "-"}
                            </span>
                          </div>
                          <div className="border-t border-border-default pt-1.5 flex justify-between font-medium">
                            <span className="text-text-primary font-semibold">Cuota Total:</span>
                            <span className="font-data-mono font-bold text-primary">
                              {opt.totalPayableMonthly.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Options Table (Listado) con las 5 columnas requeridas */
            <div className="overflow-x-auto bg-surface border border-border-default rounded-xl p-4 shadow-sm">
              <table className="w-full text-left text-[12px] border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-border-default/80 bg-surface-container-low select-none text-text-secondary">
                    <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">Plazo</th>
                    <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">TIN</th>
                    <th
                      className={`py-3 px-3 font-semibold uppercase tracking-wider text-[11px] ${
                        insuranceViewTab === "without_insurance" ? "text-primary font-bold" : ""
                      }`}
                    >
                      Cuota Mensual
                    </th>
                    {insuranceViewTab === "with_insurance" && (
                      <>
                        <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">Seguro</th>
                        <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] text-primary font-bold">
                          Cuota Total (cuota + seguro)
                        </th>
                      </>
                    )}
                    <th className="py-3 px-3 text-right font-semibold uppercase tracking-wider text-[11px]">
                      Seleccionar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/40 font-body-sm text-[13px]">
                  {commercialOptions.map((opt) => {
                    const optKey = `${opt.termMonths}-${opt.tinRate}`;
                    const isSelected = selectedOptionKey
                      ? selectedOptionKey === optKey
                      : selectedTerm === opt.termMonths;

                    return (
                      <tr
                        key={optKey}
                        onClick={() => {
                          setSelectedOptionKey(optKey);
                          setSelectedTerm(opt.termMonths);
                          clearAlerts();
                        }}
                        className={`transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 hover:bg-primary/15 font-semibold text-primary"
                            : "hover:bg-surface-container-high/40 text-text-secondary"
                        }`}
                      >
                        {/* 1. Plazo */}
                        <td className="py-3.5 px-3">
                          <span className={`font-semibold ${isSelected ? "text-primary" : "text-text-primary"}`}>
                            {opt.termMonths} Meses
                          </span>
                          <span className="text-[11px] text-text-tertiary ml-1.5">
                            ({opt.termMonths / 12} {opt.termMonths === 12 ? "Año" : "Años"})
                          </span>
                        </td>

                        {/* 2. TIN */}
                        <td className="py-3.5 px-3 font-data-mono font-bold text-text-primary">
                          <span className="px-2 py-0.5 rounded bg-surface-container-high border border-border-default/60 text-[12px]">
                            {opt.tinRate.toFixed(2)}%
                          </span>
                        </td>

                        {/* 3. Cuota Mensual */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-data-mono text-[14px] ${
                              insuranceViewTab === "without_insurance"
                                ? "font-bold text-primary"
                                : "text-text-primary"
                            }`}
                          >
                            {opt.monthlyPayment.toLocaleString("es-ES", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </span>
                          <span className="text-[10px] text-text-tertiary ml-1 font-normal">/mes</span>
                        </td>

                        {insuranceViewTab === "with_insurance" && (
                          <>
                            {/* 4. Seguro */}
                            <td className="py-3.5 px-3 font-data-mono text-text-secondary">
                              {opt.insuranceMonthly > 0 ? (
                                <span>
                                  {opt.insuranceMonthly.toLocaleString("es-ES", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                  <span className="text-[10px] text-text-tertiary ml-1 font-normal">/mes</span>
                                </span>
                              ) : (
                                <span className="text-text-disabled">-</span>
                              )}
                            </td>

                            {/* 5. Cuota Total (cuota mensual + seguro) */}
                            <td className="py-3.5 px-3">
                              <span className="font-data-mono text-[14px] font-bold text-primary">
                                {opt.totalPayableMonthly.toLocaleString("es-ES", {
                                  style: "currency",
                                  currency: "EUR",
                                })}
                              </span>
                              <span className="text-[10px] text-text-tertiary ml-1 font-normal">/mes</span>
                            </td>
                          </>
                        )}

                        {/* Selección */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-current">
                            {isSelected && <span className="w-2.5 h-2.5 bg-current rounded-full" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Alert Message */}
          {errorMsg && (
            <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-4 font-body-sm text-[13px] mt-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-success/10 border border-success/30 text-success rounded-lg p-4 font-body-sm text-[13px] mt-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{successMsg}</span>
              </div>
              {selectedLeadId && (
                <Link
                  href={`/leads/${selectedLeadId}`}
                  className="px-3.5 py-1.5 bg-success text-white hover:bg-success/90 font-medium rounded-lg text-[12px] transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Volver al Lead
                </Link>
              )}
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                if (selectedLeadId) {
                  router.push(`/leads/${selectedLeadId}`);
                } else {
                  router.back();
                }
              }}
              className="px-5 py-2.5 border border-border-default text-text-secondary hover:text-text-primary rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
            >
              {selectedLeadId ? "Volver al Lead" : "Cancelar"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !isValidToSave}
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
