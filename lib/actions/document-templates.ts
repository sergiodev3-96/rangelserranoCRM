"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/actions/auth";
import {
  DocumentTemplate,
  TemplateId,
  TemplateContent,
  DEFAULT_TEMPLATES,
} from "@/types/document-templates";

const STORE_PATH = path.join(process.cwd(), "lib", "data", "document-templates-store.json");

function ensureStoreFile(): Record<TemplateId, DocumentTemplate> {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_TEMPLATES, null, 2), "utf-8");
      } catch {
        // Ignored on read-only environments
      }
      return { ...DEFAULT_TEMPLATES };
    }
    const data = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error with document templates store file:", err);
    return { ...DEFAULT_TEMPLATES };
  }
}

function saveStoreFile(data: Record<TemplateId, DocumentTemplate>): boolean {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving document templates store file:", err);
    return false;
  }
}

export async function checkDocumentTemplatesTable(): Promise<{ exists: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("document_templates").select("id").limit(1);
    if (error) {
      if (
        error.code === "PGRST205" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("schema cache")
      ) {
        return { exists: false, error: "La tabla 'document_templates' no existe en Supabase." };
      }
      return { exists: false, error: error.message };
    }
    return { exists: true };
  } catch (err) {
    return { exists: false, error: err instanceof Error ? err.message : "Error al conectar con Supabase" };
  }
}

export async function getDocumentTemplates(): Promise<DocumentTemplate[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .order("id");

    if (!error && data && data.length > 0) {
      return data as DocumentTemplate[];
    }
  } catch (err) {
    console.warn("Could not fetch document_templates from Supabase, using local fallback store:", err);
  }

  // Fallback to local store or defaults
  const store = ensureStoreFile();
  return Object.values(store);
}

export async function getDocumentTemplate(id: TemplateId): Promise<DocumentTemplate> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return data as DocumentTemplate;
    }
  } catch (err) {
    console.warn(`Could not fetch template ${id} from Supabase, using fallback:`, err);
  }

  const store = ensureStoreFile();
  return store[id] || DEFAULT_TEMPLATES[id];
}

export async function updateDocumentTemplate(
  id: TemplateId,
  content: TemplateContent
): Promise<{ success: boolean; error?: string; warning?: string }> {
  try {
    const profileRes = await getCurrentProfile();
    if (!profileRes.success || !profileRes.data) {
      return { success: false, error: "Usuario no autenticado." };
    }
    if (profileRes.data.role !== "admin") {
      return { success: false, error: "No autorizado. Se requieren permisos de administrador." };
    }

    let supabaseSaved = false;
    let supabaseError: string | null = null;

    // 1. Try to update in Supabase
    try {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from("document_templates")
        .upsert({
          id,
          name: DEFAULT_TEMPLATES[id]?.name || id,
          description: DEFAULT_TEMPLATES[id]?.description || "",
          content,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        supabaseError = error.message;
        if (error.code !== "PGRST205") {
          console.warn("Supabase upsert warning:", error);
        }
      } else {
        supabaseSaved = true;
      }
    } catch (dbErr) {
      supabaseError = dbErr instanceof Error ? dbErr.message : "Error al conectar con Supabase";
      console.warn("Supabase update error (non-fatal, local fallback active):", dbErr);
    }

    // 2. Update in fallback JSON store
    const store = ensureStoreFile();
    store[id] = {
      ...DEFAULT_TEMPLATES[id],
      ...(store[id] || {}),
      content,
      updated_at: new Date().toISOString(),
    };
    const fileSaved = saveStoreFile(store);

    revalidatePath("/admin/plantillas-documentos");
    revalidatePath("/leads");

    if (!supabaseSaved && !fileSaved) {
      return {
        success: false,
        error: `No se pudo guardar la plantilla: La tabla 'document_templates' no existe en Supabase y el almacenamiento local no es accesible en este entorno. Por favor, ejecuta la migración '0014_document_templates_and_lead_contract_fields.sql' en el SQL Editor de tu panel de Supabase.${supabaseError ? ` (${supabaseError})` : ""}`,
      };
    }

    if (!supabaseSaved) {
      return {
        success: true,
        warning: "Guardado temporalmente en almacenamiento local. La tabla 'document_templates' aún no existe en Supabase; debes ejecutar la migración 0014 en Supabase para que los cambios se mantengan en producción.",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Error updating document template:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al actualizar la plantilla",
    };
  }
}

export async function resetDocumentTemplate(
  id: TemplateId
): Promise<{ success: boolean; error?: string; warning?: string }> {
  try {
    const profileRes = await getCurrentProfile();
    if (!profileRes.success || !profileRes.data) {
      return { success: false, error: "Usuario no autenticado." };
    }
    if (profileRes.data.role !== "admin") {
      return { success: false, error: "No autorizado. Se requieren permisos de administrador." };
    }

    const defaultTemplate = DEFAULT_TEMPLATES[id];
    if (!defaultTemplate) {
      return { success: false, error: "Plantilla no encontrada" };
    }

    return await updateDocumentTemplate(id, defaultTemplate.content);
  } catch (err: unknown) {
    console.error("Error resetting template:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al reiniciar la plantilla",
    };
  }
}
