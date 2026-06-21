// Tipo genérico para respuestas de Server Actions
export type ActionResult<T = void> = {
  success: true;
  data: T;
  error: null;
} | {
  success: false;
  data: null;
  error: string;
};
