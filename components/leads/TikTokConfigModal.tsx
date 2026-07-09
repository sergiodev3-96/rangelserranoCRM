"use client";

import React, { useState, useEffect } from "react";
import { getTikTokVerifyToken } from "@/lib/actions/integrations";

interface TikTokConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TikTokConfigModal({ isOpen, onClose }: TikTokConfigModalProps) {
  const [token, setToken] = useState<string>("Cargando...");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Configurar URL del webhook
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setWebhookUrl(`${origin}/api/webhooks/tiktok-leads`);

      // Obtener el token
      getTikTokVerifyToken().then((res) => {
        if (res.success && res.data) {
          setToken(res.data);
        } else {
          setToken("Error al cargar token");
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border-default rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#000000] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">music_note</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-[20px] text-text-primary">Configuración TikTok Leads</h2>
              <p className="font-body-sm text-[13px] text-text-secondary">Vincula tus campañas de Lead Generation de TikTok Ads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-2 rounded-full hover:bg-bg-input"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 font-body-sm text-[14px] text-text-primary space-y-6">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3 text-primary">
            <span className="material-symbols-outlined text-[20px] shrink-0">info</span>
            <p>
              Usa los siguientes datos para configurar el <b>Webhook personalizado</b> en el apartado de integraciones CRM dentro de tu cuenta de TikTok Ads Manager.
            </p>
          </div>

          <div className="space-y-4">
            {/* Webhook URL */}
            <div>
              <label className="block text-text-secondary mb-1.5 font-medium">URL del Webhook</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-bg-input border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none"
                />
                <button
                  onClick={handleCopyUrl}
                  className="bg-bg-input hover:bg-border-default border border-border-default text-text-primary px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors min-w-[110px] justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copiedUrl ? "check" : "content_copy"}
                  </span>
                  {copiedUrl ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            {/* Verify Token */}
            <div>
              <label className="block text-text-secondary mb-1.5 font-medium">Token de Verificación</label>
              <div className="flex gap-2 relative">
                <input
                  type={showToken ? "text" : "password"}
                  readOnly
                  value={token}
                  className="flex-1 bg-bg-input border border-border-default rounded-lg pl-4 pr-12 py-2.5 text-text-primary focus:outline-none tracking-wider font-mono text-[13px]"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-[125px] top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 rounded-md"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showToken ? "visibility_off" : "visibility"}
                  </span>
                </button>
                <button
                  onClick={handleCopyToken}
                  className="bg-bg-input hover:bg-border-default border border-border-default text-text-primary px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors min-w-[110px] justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copiedToken ? "check" : "content_copy"}
                  </span>
                  {copiedToken ? "Copiar" : "Copiar"}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border-default pt-6">
            <h3 className="font-headline-sm text-[16px] mb-3">Pasos de integración</h3>
            <ol className="list-decimal pl-5 space-y-2 text-text-secondary text-[13px]">
              <li>Entra en <b>TikTok Ads Manager</b> y ve a <b>Tools &gt; Leads Center</b>.</li>
              <li>Accede a la sección de configuración o selecciona tu formulario instantáneo (Instant Form).</li>
              <li>Busca la opción de <b>Custom Webhook</b> (Webhook personalizado).</li>
              <li>Pega la <b>URL del Webhook</b> proporcionada arriba.</li>
              <li>Pega el <b>Token de Verificación</b> en el campo correspondiente para que TikTok pueda validar la conexión.</li>
              <li>Guarda los cambios. TikTok enviará una petición de prueba para validar que el endpoint está activo.</li>
            </ol>
            <a 
              href="https://ads.tiktok.com/help/article/available-crm-integrations-tiktok-lead-generation?lang=es" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline mt-4 font-medium text-[13px]"
            >
              Ver documentación oficial <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
