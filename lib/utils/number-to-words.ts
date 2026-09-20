// Utility to convert numbers to Spanish words for contracts and invoices

const UNIDADES = [
  "",
  "un",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];

const DECENAS = [
  "",
  "diez",
  "veinte",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
];

const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function convertGroup(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";

  let out = "";
  if (n >= 100) {
    out += CENTENAS[Math.floor(n / 100)] + " ";
    n %= 100;
  }

  if (n <= 29) {
    out += UNIDADES[n];
  } else {
    const dec = Math.floor(n / 10);
    const uni = n % 10;
    out += DECENAS[dec];
    if (uni > 0) {
      out += " y " + UNIDADES[uni];
    }
  }

  return out.trim();
}

export function numberToSpanishWords(num: number): string {
  if (isNaN(num) || num === 0) return "cero";

  const integerPart = Math.floor(Math.abs(num));
  if (integerPart === 0) return "cero";

  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) {
      parts.push("un millón");
    } else {
      parts.push(`${convertGroup(millions)} millones`);
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push("mil");
    } else {
      parts.push(`${convertGroup(thousands)} mil`);
    }
  }

  if (remainder > 0) {
    parts.push(convertGroup(remainder));
  }

  return parts.join(" ").trim();
}
