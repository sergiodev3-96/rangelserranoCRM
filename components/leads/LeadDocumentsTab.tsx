"use client";

import React, { useState, useTransition } from "react";
import type { LeadWithAssignee } from "@/types/leads";
import {
  DocumentTemplate,
  TemplateId,
  DEFAULT_TEMPLATES,
  ReservaContent,
  GarantiaContent,
  ContratoContent,
} from "@/types/document-templates";
import { updateLeadOperationDetails } from "@/lib/actions/leads";
import { numberToSpanishWords } from "@/lib/utils/number-to-words";

type Props = {
  lead: LeadWithAssignee;
  templates?: DocumentTemplate[];
  canEdit: boolean;
  onRefresh: () => void;
};

export default function LeadDocumentsTab({
  lead,
  templates,
  canEdit,
  onRefresh,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedDoc, setSelectedDoc] = useState<TemplateId>("reserva_venta");
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fallback to DEFAULT_TEMPLATES if none provided
  const templatesMap: Record<TemplateId, DocumentTemplate> = React.useMemo(() => {
    const map = { ...DEFAULT_TEMPLATES };
    if (templates && templates.length > 0) {
      templates.forEach((t) => {
        map[t.id] = t;
      });
    }
    return map;
  }, [templates]);

  const activeTemplate = templatesMap[selectedDoc];

  // Today's date formatted as DD/MM/YYYY
  const todayFormatted = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Client form states initialized from lead
  const [clientName, setClientName] = useState(lead.full_name || "");
  const [dniNie, setDniNie] = useState(lead.dni_nie || "");
  const [address, setAddress] = useState(lead.client_address || "");
  const [postalCode, setPostalCode] = useState(lead.client_postal_code || "");
  const [city, setCity] = useState(lead.client_city || "");
  const [province, setProvince] = useState(lead.client_province || "");
  const [phone, setPhone] = useState(lead.phone || "");
  const [email, setEmail] = useState(lead.email || "");

  // Vehicle form states
  const [brand, setBrand] = useState(lead.vehicle_brand || "");
  const [model, setModel] = useState(lead.vehicle_model || "");
  const [plate, setPlate] = useState(lead.vehicle_plate || "");
  const [vin, setVin] = useState(lead.vehicle_vin || "");
  const [kms, setKms] = useState<string>(lead.vehicle_kms ? lead.vehicle_kms.toString() : "31467");
  const [year, setYear] = useState<string>(lead.vehicle_year ? lead.vehicle_year.toString() : "2023");
  const [color, setColor] = useState(lead.vehicle_color || "Blanco");
  const [fuel, setFuel] = useState(lead.vehicle_fuel || "Gasolina");
  const [regDate, setRegDate] = useState(lead.vehicle_reg_date || todayFormatted);
  const [itvDate, setItvDate] = useState(lead.vehicle_itv_date || "21/03/2027");

  // Document/Pricing form states
  const [price, setPrice] = useState<string>(lead.vehicle_price ? lead.vehicle_price.toString() : "19400");
  const [reservationAmount, setReservationAmount] = useState<string>(
    lead.reservation_amount ? lead.reservation_amount.toString() : "500"
  );
  const [docDate, setDocDate] = useState(todayFormatted);
  const [signingCity, setSigningCity] = useState("Sevilla");

  // Derived calculations
  const numPrice = parseFloat(price) || 0;
  const numReserva = parseFloat(reservationAmount) || 0;
  const numPendiente = Math.max(0, numPrice - numReserva);
  const priceInWords = numberToSpanishWords(numPrice);

  const handleSaveToLead = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await updateLeadOperationDetails(lead.id, {
        full_name: clientName,
        dni_nie: dniNie,
        client_address: address,
        client_postal_code: postalCode,
        client_city: city,
        client_province: province,
        phone: phone,
        email: email,
        vehicle_brand: brand,
        vehicle_model: model,
        vehicle_plate: plate,
        vehicle_vin: vin,
        vehicle_kms: parseInt(kms, 10) || null,
        vehicle_year: parseInt(year, 10) || null,
        vehicle_color: color,
        vehicle_fuel: fuel,
        vehicle_reg_date: regDate,
        vehicle_itv_date: itvDate,
        vehicle_price: numPrice || null,
        reservation_amount: numReserva || null,
      });

      if (res.success) {
        setStatusMessage({ text: "Datos guardados en la ficha del Lead correctamente", type: "success" });
        onRefresh();
      } else {
        setStatusMessage({ text: res.error || "Error al guardar en el lead", type: "error" });
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action bar (hidden during print) */}
      <div className="no-print bg-surface border border-border-default rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        {/* Document Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto select-none">
          <button
            type="button"
            onClick={() => setSelectedDoc("reserva_venta")}
            className={`px-4 py-2 rounded-lg font-body-sm text-[13px] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              selectedDoc === "reserva_venta"
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary border border-border-default"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">bookmark</span>
            <span>1. Reserva de Compra</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDoc("contrato_compraventa")}
            className={`px-4 py-2 rounded-lg font-body-sm text-[13px] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              selectedDoc === "contrato_compraventa"
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary border border-border-default"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history_edu</span>
            <span>2. Contrato Compraventa</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDoc("garantia_delegada")}
            className={`px-4 py-2 rounded-lg font-body-sm text-[13px] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              selectedDoc === "garantia_delegada"
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary border border-border-default"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>3. Garantía Delegada</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {canEdit && (
            <button
              type="button"
              onClick={handleSaveToLead}
              disabled={isPending}
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-text-primary border border-border-default rounded-lg font-body-sm text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Guarda los datos editados en este formulario en la ficha permanente del Lead"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPending ? "sync" : "save"}
              </span>
              <span>Guardar en Lead</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(79,70,229,0.35)] rounded-lg font-body-sm text-[13px] font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {statusMessage && (
        <div
          className={`no-print px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === "success"
              ? "bg-success/15 text-success border border-success/20"
              : "bg-danger/15 text-danger border border-danger/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">
              {statusMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-[14px]">✕</button>
        </div>
      )}

      {/* Main Grid: Left editor (no-print) + Right Live Document Preview (printable) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start print:block print:w-full print:m-0 print:p-0">
        {/* LEFT COLUMN: Data Form (Hidden during print) */}
        <div className="no-print xl:col-span-5 space-y-5">
          {/* Card: Datos del Cliente */}
          <div className="glass-card rounded-xl p-5 border border-border-default space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border-default">
              <span className="material-symbols-outlined text-primary text-[20px]">person</span>
              <h3 className="font-section-subtitle text-[15px] text-text-primary font-bold">
                Datos del Comprador
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    DNI / NIE
                  </label>
                  <input
                    type="text"
                    value={dniNie}
                    onChange={(e) => setDniNie(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Dirección / Domicilio
                </label>
                <input
                  type="text"
                  placeholder="Calle, número, piso..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    C.P.
                  </label>
                  <input
                    type="text"
                    placeholder="29630"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Municipio
                  </label>
                  <input
                    type="text"
                    placeholder="Benalmádena"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    placeholder="Málaga"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Card: Datos del Vehículo */}
          <div className="glass-card rounded-xl p-5 border border-border-default space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border-default">
              <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
              <h3 className="font-section-subtitle text-[15px] text-text-primary font-bold">
                Datos del Vehículo
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Nissan / SEAT / JEEP"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Modelo y Versión
                  </label>
                  <input
                    type="text"
                    placeholder="Micra / Arona / Avenger"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    placeholder="1234ABC"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    VIN / Nº Bastidor
                  </label>
                  <input
                    type="text"
                    placeholder="17 dígitos"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    placeholder="2023"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Kilometraje
                  </label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={kms}
                    onChange={(e) => setKms(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="Gris / Blanco"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Combustible
                  </label>
                  <input
                    type="text"
                    placeholder="Gasolina / Diésel / Híbrido"
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Fecha Matriculación
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Próxima ITV
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={itvDate}
                    onChange={(e) => setItvDate(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Condiciones Económicas y Documento */}
          <div className="glass-card rounded-xl p-5 border border-border-default space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border-default">
              <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
              <h3 className="font-section-subtitle text-[15px] text-text-primary font-bold">
                Importes y Emisión
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Precio Venta al Contado (€)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[14px] font-bold font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Importe Señal / Reserva (€)
                  </label>
                  <input
                    type="number"
                    value={reservationAmount}
                    onChange={(e) => setReservationAmount(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[14px] font-bold font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Fecha del Documento
                  </label>
                  <input
                    type="text"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Ciudad de Firma
                  </label>
                  <input
                    type="text"
                    value={signingCity}
                    onChange={(e) => setSigningCity(e.target.value)}
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Document Preview (Printable target) */}
        <div className="xl:col-span-7 flex flex-col items-center print:block print:w-full print:m-0 print:p-0">
          <div className="w-full flex items-center justify-between mb-2 text-xs text-text-secondary no-print">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[11px]">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              Vista Previa en Tiempo Real (Formato A4)
            </span>
            <span>Edita los campos de la izquierda para actualizarla</span>
          </div>

          {/* Printable Document Container */}
          <div className="print-document-container w-full bg-white text-[#111827] shadow-xl rounded-sm border border-slate-200 p-8 sm:p-12 font-sans text-left text-[12px] leading-relaxed transition-all">
            
            {/* DOCUMENT 1: RESERVA DE COMPRA */}
            {selectedDoc === "reserva_venta" && (
              <table className="print-table w-full border-collapse border-0">
                <thead>
                  <tr>
                    <th className="p-0 pb-4 border-0 font-normal text-left">
                      {/* Repeating Header with Logo & Title */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                        <div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/logo_rangel_serrano.png"
                            alt="Rangel & Serrano"
                            className="h-12 w-auto object-contain"
                          />
                        </div>
                        <div className="text-right">
                          <h1 className="text-[17px] font-black tracking-tight text-slate-900 uppercase">
                            {(activeTemplate.content as ReservaContent).title}
                          </h1>
                          <p className="text-[11px] font-medium text-slate-500">
                            Rangel &amp; Serrano, S.L. · CIF: {activeTemplate.content.seller_cif}
                          </p>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="p-0 border-0 align-top space-y-4">
                      {/* Seller and Buyer 2-column Box */}
                      <div className="print-section grid grid-cols-2 gap-4 border border-slate-300 rounded p-4 bg-slate-50/50">
                        <div className="space-y-1">
                          <p className="font-bold text-[11px] text-slate-900 uppercase border-b border-slate-200 pb-1">
                            Vendedor:
                          </p>
                          <p><span className="font-semibold">Nombre:</span> {activeTemplate.content.seller_name}</p>
                          <p><span className="font-semibold">CIF:</span> {activeTemplate.content.seller_cif}</p>
                          <p><span className="font-semibold">Domicilio:</span> {activeTemplate.content.seller_address}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-bold text-[11px] text-slate-900 uppercase border-b border-slate-200 pb-1">
                            Comprador:
                          </p>
                          <p><span className="font-semibold">Nombre:</span> {clientName || "—"}</p>
                          <p><span className="font-semibold">DNI/NIE:</span> {dniNie || "—"}</p>
                          <p>
                            <span className="font-semibold">Domicilio:</span>{" "}
                            {address || "Dirección"}{postalCode ? ` (${postalCode})` : ""}{city ? ` - ${city}` : ""}{province ? ` (${province})` : ""}
                          </p>
                          {phone && <p><span className="font-semibold">Teléfono:</span> {phone}</p>}
                          {email && <p><span className="font-semibold">Email:</span> {email}</p>}
                        </div>
                      </div>

                      {/* Reservation Details Box */}
                      <div className="print-section border border-slate-300 rounded p-4 bg-slate-50/50 space-y-1.5">
                        <p className="font-bold text-[11px] text-slate-900 uppercase border-b border-slate-200 pb-1">
                          Datos de la Reserva:
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <p><span className="font-semibold">Fecha:</span> {docDate}</p>
                          <p><span className="font-semibold">Importe Reserva:</span> <strong className="text-slate-900 font-bold">{numReserva.toLocaleString("es-ES")} €</strong> (imputable al precio final)</p>
                          <p className="col-span-2"><span className="font-semibold">IBAN de Abono:</span> <span className="font-mono font-bold">{(activeTemplate.content as ReservaContent).seller_iban}</span></p>
                        </div>
                      </div>

                      {/* Vehicle Specs Box */}
                      <div className="print-section border border-slate-300 rounded p-4 bg-slate-50/50 space-y-1.5">
                        <p className="font-bold text-[11px] text-slate-900 uppercase border-b border-slate-200 pb-1">
                          Datos del Vehículo Reservado:
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                          <p><span className="font-semibold">Marca y Modelo:</span> {brand} {model}</p>
                          <p><span className="font-semibold">Bastidor (VIN):</span> <span className="font-mono">{vin || "—"}</span></p>
                          <p><span className="font-semibold">Matrícula:</span> <span className="font-mono font-bold">{plate || "—"}</span></p>
                          <p><span className="font-semibold">Color:</span> {color}</p>
                          <p><span className="font-semibold">Kilometraje:</span> {kms ? `${parseInt(kms, 10).toLocaleString("es-ES")} km` : "—"}</p>
                          <p><span className="font-semibold">Precio al Contado:</span> <strong className="font-bold text-[14px] text-slate-900">{numPrice.toLocaleString("es-ES")} €</strong></p>
                        </div>
                      </div>

                      {/* Conditions */}
                      <div className="print-section space-y-2 pt-1">
                        <p className="font-bold text-[11px] text-slate-900 uppercase border-b border-slate-200 pb-1">
                          Condiciones de la Reserva:
                        </p>
                        <div className="space-y-2 text-[11.5px] text-slate-700 leading-relaxed text-justify">
                          {(activeTemplate.content as ReservaContent).conditions.map((cond, i) => (
                            <p key={i}>• {cond}</p>
                          ))}
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="print-section grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200">
                        <div className="text-center space-y-12">
                          <p className="font-bold text-slate-800 text-[11px] uppercase">Firma del Vendedor</p>
                          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                          <p className="text-[10px] text-slate-500">{activeTemplate.content.seller_name}</p>
                        </div>
                        <div className="text-center space-y-12">
                          <p className="font-bold text-slate-800 text-[11px] uppercase">Firma del Comprador</p>
                          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                          <p className="text-[10px] text-slate-500">{clientName || "El Comprador"}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* DOCUMENT 2: CONTRATO DE COMPRAVENTA */}
            {selectedDoc === "contrato_compraventa" && (
              <table className="print-table w-full border-collapse border-0">
                <thead>
                  <tr>
                    <th className="p-0 pb-4 border-0 font-normal text-left">
                      {/* Repeating Header with Logo & Title */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/logo_rangel_serrano.png"
                          alt="Rangel & Serrano"
                          className="h-10 w-auto object-contain"
                        />
                        <div className="text-right">
                          <h1 className="text-[15px] font-black tracking-tight text-slate-900 uppercase">
                            {(activeTemplate.content as ContratoContent).title}
                          </h1>
                          <p className="text-[10.5px] font-medium text-slate-500">
                            En {signingCity || (activeTemplate.content as ContratoContent).city}, a {docDate}
                          </p>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="p-0 border-0 align-top space-y-4">
                      {/* Intervinientes */}
                      <div className="print-section border border-slate-300 rounded p-3 bg-slate-50/50 space-y-2 text-[11.5px]">
                        <p>
                          <strong className="text-slate-900 uppercase">Vendedor y Garante:</strong> {activeTemplate.content.seller_name}, con CIF {activeTemplate.content.seller_cif} y domicilio en {activeTemplate.content.seller_address}.
                        </p>
                        <p>
                          <strong className="text-slate-900 uppercase">Comprador:</strong> {clientName || "—"}, con DNI/NIE {dniNie || "—"}, domicilio en {address || "—"} {postalCode ? `(C.P. ${postalCode})` : ""} {city ? `- ${city}` : ""} {province ? `(${province})` : ""}, Tel: {phone || "—"}, Email: {email || "—"}.
                        </p>
                      </div>

                      {/* Vehículo */}
                      <div className="print-section border border-slate-300 rounded p-3 bg-slate-50/50 space-y-1 text-[11.5px]">
                        <p className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-1">
                          Vehículo Objeto del Presente Contrato:
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <p><span className="font-semibold">Marca y modelo:</span> {brand} {model}</p>
                          <p><span className="font-semibold">Matrícula:</span> <strong className="font-mono">{plate || "—"}</strong></p>
                          <p><span className="font-semibold">Nº de bastidor:</span> <span className="font-mono">{vin || "—"}</span></p>
                          <p><span className="font-semibold">Fecha matriculación:</span> {regDate}</p>
                          <p><span className="font-semibold">Estado ITV / Próxima ITV:</span> {itvDate}</p>
                          <p><span className="font-semibold">Kilómetros:</span> {kms ? `${parseInt(kms, 10).toLocaleString("es-ES")} Km` : "—"}</p>
                          <p><span className="font-semibold">Combustible:</span> {fuel}</p>
                          <p><span className="font-semibold">Estado del vehículo:</span> Usado, acorde a su edad y kilometraje.</p>
                        </div>
                      </div>

                      {/* Cláusulas */}
                      <div className="print-section space-y-2 text-[11px] text-justify text-slate-800 leading-relaxed">
                        <p className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-0.5">
                          Cláusulas y Condiciones Pactadas:
                        </p>
                        <p>
                          <strong>1. Precio:</strong> El precio del vehículo, teniendo en cuenta su condición de bien usado, características y estado, los cuales han sido clave para determinar su precio, se pacta de común acuerdo en la cantidad de <strong>{numPrice.toLocaleString("es-ES")} €</strong> ({priceInWords} euros), transferencia, garantía e IVA incluidos.
                        </p>
                        <p>
                          <strong>2. Forma de pago:</strong> {numReserva.toLocaleString("es-ES")} € mediante tarjeta de crédito/débito o reserva previa, y {numPendiente.toLocaleString("es-ES")} € mediante transferencia bancaria o financiación.
                        </p>
                        {(activeTemplate.content as ContratoContent).clauses.slice(2).map((c, i) => (
                          <p key={i}><strong>{i + 3}.</strong> {c}</p>
                        ))}
                      </div>

                      {/* Exclusiones de garantía */}
                      <div className="print-section space-y-1 text-[10px] text-justify text-slate-700 leading-normal border-t border-slate-200 pt-2">
                        <p className="font-bold text-slate-800 uppercase">No procederá reclamación por falta de conformidad en los siguientes casos:</p>
                        <p className="text-slate-600">
                          {(activeTemplate.content as ContratoContent).exclusions.join(" ")}
                        </p>
                      </div>

                      {/* RGPD y Jurisdicción */}
                      <div className="print-section space-y-1 text-[9.5px] text-justify text-slate-600 border-t border-slate-200 pt-2">
                        <p><strong>RGPD:</strong> {(activeTemplate.content as ContratoContent).gdpr_clause} [X] Sí [ ] No.</p>
                        <p><strong>Jurisdicción:</strong> {(activeTemplate.content as ContratoContent).jurisdiction}</p>
                      </div>

                      {/* Firmas */}
                      <div className="print-section grid grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                        <div className="text-center space-y-10">
                          <p className="font-bold text-slate-800 text-[10.5px] uppercase">Firma del Vendedor</p>
                          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                          <p className="text-[9.5px] text-slate-500">{activeTemplate.content.seller_name}</p>
                        </div>
                        <div className="text-center space-y-10">
                          <p className="font-bold text-slate-800 text-[10.5px] uppercase">Firma del Comprador</p>
                          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                          <p className="text-[9.5px] text-slate-500">{clientName || "El Comprador"}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* DOCUMENT 3: GARANTÍA COMERCIAL DELEGADA */}
            {selectedDoc === "garantia_delegada" && (
              <table className="print-table w-full border-collapse border-0">
                <thead>
                  <tr>
                    <th className="p-0 pb-4 border-0 font-normal text-left">
                      {/* Repeating Header with Logo & Title */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/logo_rangel_serrano.png"
                          alt="Rangel & Serrano"
                          className="h-10 w-auto object-contain"
                        />
                        <div className="text-right">
                          <h1 className="text-[14px] font-black tracking-tight text-slate-900 uppercase">
                            {(activeTemplate.content as GarantiaContent).title}
                          </h1>
                          <p className="text-[10.5px] font-medium text-slate-500">
                            En {signingCity || (activeTemplate.content as GarantiaContent).city}, a {docDate}
                          </p>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="p-0 border-0 align-top space-y-4">
                      {/* Proveedor y Comprador */}
                      <div className="print-section grid grid-cols-2 gap-4 border border-slate-300 rounded p-3 bg-slate-50/50 text-[11.5px]">
                        <div>
                          <p className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-1">
                            Proveedor de Garantía:
                          </p>
                          <p><span className="font-semibold">Nombre:</span> {activeTemplate.content.seller_name}</p>
                          <p><span className="font-semibold">CIF:</span> {activeTemplate.content.seller_cif}</p>
                          <p><span className="font-semibold">Dirección:</span> {activeTemplate.content.seller_address}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-1">
                            Datos del Comprador:
                          </p>
                          <p><span className="font-semibold">Nombre:</span> {clientName || "—"}</p>
                          <p><span className="font-semibold">DNI/NIE:</span> {dniNie || "—"}</p>
                          <p><span className="font-semibold">Dirección:</span> {address || "—"}</p>
                        </div>
                      </div>

                      {/* Ficha Vehículo */}
                      <div className="print-section border border-slate-300 rounded p-3 bg-slate-50/50 space-y-1 text-[11px]">
                        <p className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-1">
                          Datos del Vehículo Objeto de la Garantía:
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <p><span className="font-semibold">Marca y modelo:</span> {brand} {model}</p>
                          <p><span className="font-semibold">Matrícula:</span> <strong className="font-mono">{plate || "—"}</strong></p>
                          <p><span className="font-semibold">Número de chasis:</span> <span className="font-mono">{vin || "—"}</span></p>
                          <p><span className="font-semibold">Combustible:</span> {fuel}</p>
                          <p><span className="font-semibold">Kilometraje:</span> {kms ? `${parseInt(kms, 10).toLocaleString("es-ES")} Km` : "—"}</p>
                          <p><span className="font-semibold">Fecha de matriculación:</span> {regDate}</p>
                          <p><span className="font-semibold">Estado / Próxima ITV:</span> Favorable ({itvDate})</p>
                          <p><span className="font-semibold">Estado:</span> Usado, acorde a su edad y kilometraje.</p>
                        </div>
                      </div>

                      {/* Condiciones Generales */}
                      <div className="print-section space-y-1.5 text-[11px] text-justify text-slate-800 leading-relaxed">
                        <p className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-0.5">
                          Condiciones Generales:
                        </p>
                        {(activeTemplate.content as GarantiaContent).general_conditions.map((gc, i) => (
                          <p key={i}>• {gc}</p>
                        ))}
                      </div>

                      {/* Exclusiones */}
                      <div className="print-section space-y-1 text-[10px] text-justify text-slate-700 leading-normal border-t border-slate-200 pt-2">
                        <p className="font-bold text-slate-800 uppercase">Exclusiones de Garantía:</p>
                        <div className="grid grid-cols-1 gap-0.5">
                          {(activeTemplate.content as GarantiaContent).exclusions.map((ex, i) => (
                            <p key={i}>{ex}</p>
                          ))}
                        </div>
                      </div>

                      {/* Piezas */}
                      <div className="print-section text-[10px] text-slate-600 border-t border-slate-200 pt-1.5">
                        <p><strong>Piezas utilizadas:</strong> {(activeTemplate.content as GarantiaContent).parts_clause}</p>
                      </div>

                      {/* Firmas */}
                      <div className="print-section grid grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                        <div className="text-center space-y-10">
                          <p className="font-bold text-slate-800 text-[10.5px] uppercase">Firma del Garante</p>
                          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                          <p className="text-[9.5px] text-slate-500">{activeTemplate.content.seller_name}</p>
                        </div>
                        <div className="text-center space-y-10">
                          <p className="font-bold text-slate-800 text-[10.5px] uppercase">Firma del Comprador</p>
                          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                          <p className="text-[9.5px] text-slate-500">{clientName || "El Comprador"}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
