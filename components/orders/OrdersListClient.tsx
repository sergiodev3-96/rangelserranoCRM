"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/types/orders";
import { ORDER_STATUS_CONFIG } from "@/types/orders";
import { updateOrderStatus } from "@/lib/actions/orders";

type OrdersListClientProps = {
  initialOrders: Order[];
  currentUser: { id: string; role: "admin" | "comercial" };
};

export default function OrdersListClient({
  initialOrders,
  currentUser,
}: OrdersListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("Todos");

  const isAdmin = currentUser.role === "admin";

  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "No se pudo actualizar el estado del pedido.");
      }
    });
  };

  const handleExportCSV = () => {
    if (initialOrders.length === 0) return;

    const headers = ["Cliente", "Vehiculo", "Precio", "Banco", "Cuota", "Estado", "Fecha"];
    const rows = filteredOrders.map((o) => [
      `"${o.client_name}"`,
      `"${o.vehicle || "No especificado"}"`,
      o.price ? `${o.price} €` : "0 €",
      `"${o.bank_entity || "N/A"}"`,
      o.monthly_payment ? `${o.monthly_payment} €/mes` : "0 €/mes",
      o.status,
      o.closed_at ? new Date(o.closed_at).toLocaleDateString("es-ES") : new Date(o.created_at).toLocaleDateString("es-ES"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedidos_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const filteredOrders = initialOrders.filter((o) => {
    if (statusFilter === "Todos") return true;
    if (statusFilter === "En revisión") return o.status === "en_revision";
    return o.status === statusFilter.toLowerCase();
  });

  return (
    <div className="p-6 space-y-6 text-left bg-bg-base text-text-primary">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
            Pedidos Finalizados
          </h1>
          <p className="font-body-sm text-[13px] text-text-secondary mt-1">
            Archivo histórico de operaciones de crédito aprobadas, denegadas y en revisión.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="bg-bg-input border border-border-default rounded-lg px-3 py-1.5 flex items-center focus-within:border-primary transition-colors select-none">
            <span className="material-symbols-outlined text-text-secondary text-[16px] mr-2">
              filter_list
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[13px] text-text-primary p-0 cursor-pointer pr-6 focus:outline-none"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Denegado">Denegado</option>
              <option value="En revisión">En revisión</option>
            </select>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 bg-surface-container-high border border-border-default text-text-primary hover:text-primary disabled:opacity-40 disabled:hover:text-text-primary rounded-lg px-4 py-1.5 text-[13px] transition-all cursor-pointer disabled:cursor-not-allowed select-none"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Orders Grid / Table */}
      <div className="w-full border border-border-default rounded-xl bg-surface overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[900px]">
          <thead>
            <tr className="border-b border-border-default bg-surface-container-low select-none">
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Nombre Cliente
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Vehículo
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Banco
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Cuota Mensual
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Estado Pedido
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider text-right">
                Fecha Registro/Cierre
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle font-body-sm text-[13px]">
            {filteredOrders.map((order) => {
              const config = ORDER_STATUS_CONFIG[order.status];
              
              return (
                <tr
                  key={order.id}
                  className="hover:bg-surface-container-high/40 transition-colors"
                >
                  {/* Client Initials & Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-text-secondary text-[12px] font-bold select-none shrink-0">
                        {getInitials(order.client_name)}
                      </div>
                      <span className="font-semibold text-text-primary font-body-md block">
                        {order.client_name}
                      </span>
                    </div>
                  </td>

                  {/* Vehicle */}
                  <td className="px-6 py-4 text-text-secondary">
                    {order.vehicle || <span className="text-text-disabled italic">No especificado</span>}
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 text-text-primary font-data-mono font-medium">
                    {order.price ? `${order.price.toLocaleString()} €` : <span className="text-text-disabled">—</span>}
                  </td>

                  {/* Bank Entity */}
                  <td className="px-6 py-4 text-text-primary font-medium">
                    {order.bank_entity || <span className="text-text-disabled">—</span>}
                  </td>

                  {/* Monthly Payment */}
                  <td className="px-6 py-4 text-text-secondary font-data-mono font-medium">
                    {order.monthly_payment ? `${order.monthly_payment.toLocaleString()} €/mes` : <span className="text-text-disabled">—</span>}
                  </td>

                  {/* Status Dropdown/Badge */}
                  <td className="px-6 py-4">
                    {isAdmin ? (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={isPending}
                        className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${config.bgClass} ${config.textClass} ${config.borderClass}`}
                      >
                        <option value="en_revision">En revisión</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="denegado">Denegado</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border select-none ${config.bgClass} ${config.textClass} ${config.borderClass}`}
                      >
                        {config.label}
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-right text-text-secondary font-data-mono">
                    {order.closed_at
                      ? new Date(order.closed_at).toLocaleDateString("es-ES")
                      : new Date(order.created_at).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              );
            })}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-disabled/40 select-none">
                  <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                  <p className="font-body-sm text-[13px]">No se encontraron registros de pedidos.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
