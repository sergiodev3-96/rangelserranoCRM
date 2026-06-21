import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getOrders } from "@/lib/actions/orders";
import OrdersListClient from "@/components/orders/OrdersListClient";

export default async function PedidosPage() {
  // 1. Obtener perfil del usuario actual y validar sesión
  const profileResult = await getCurrentProfile();
  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }
  const currentUser = {
    id: profileResult.data.id,
    role: profileResult.data.role as "admin" | "comercial",
  };

  // 2. Obtener lista de pedidos
  const ordersResult = await getOrders();
  const orders = ordersResult.success && ordersResult.data ? ordersResult.data : [];

  return (
    <OrdersListClient
      initialOrders={orders}
      currentUser={currentUser}
    />
  );
}
