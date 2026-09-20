"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
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
      fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_TEMPLATES, null, 2), "utf-8");
      return { ...DEFAULT_TEMPLATES };
    }
    const data = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error with document templates store file:", err);
    return { ...DEFAULT_TEMPLATES };
  }
}

function saveStoreFile(data: Record<TemplateId, DocumentTemplate>) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving document templates store file:", err);
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
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Try to update in Supabase
    try {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from("document_templates")
        .upsert({
          id,
          name: DEFAULT_TEMPLATES[id].name,
          description: DEFAULT_TEMPLATES[id].description,
          content,
          updated_at: new Date().toISOString(),
        });

      if (error && error.code !== "PGRST205") {
        console.warn("Supabase upsert warning:", error);
      }
    } catch (dbErr) {
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
    saveStoreFile(store);

    revalidatePath("/admin/plantillas-documentos");
    revalidatePath("/leads");

    return { success: true };
  } catch (err: any) {
    console.error("Error updating document template:", err);
    return { success: false, error: err.message || "Error al actualizar la plantilla" };
  }
}

export async function resetDocumentTemplate(
  id: TemplateId
): Promise<{ success: boolean; error?: string }> {
  try {
    const defaultTemplate = DEFAULT_TEMPLATES[id];
    if (!defaultTemplate) {
      return { success: false, error: "Plantilla no encontrada" };
    }

    return await updateDocumentTemplate(id, defaultTemplate.content);
  } catch (err: any) {
    console.error("Error resetting template:", err);
    return { success: false, error: err.message || "Error al reiniciar la plantilla" };
  }
}
