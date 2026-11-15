-- Migración 0023: Añadir columna financing_table a la tabla financial_entities
ALTER TABLE public.financial_entities
ADD COLUMN IF NOT EXISTS financing_table jsonb;

-- Asignar tabla comercial inicial por defecto a las entidades existentes que no tengan tabla
UPDATE public.financial_entities
SET financing_table = '{
  "terms": [12, 24, 36, 48, 60, 72, 84, 96, 108, 120],
  "rows": [
    {
      "tin": 8.50,
      "coefficients": {
        "36": { "without_insurance": 0.032814, "with_insurance": 0.033557 },
        "48": { "without_insurance": 0.025622, "with_insurance": 0.026442 },
        "60": { "without_insurance": 0.021327, "with_insurance": 0.022237 },
        "72": { "without_insurance": 0.018481, "with_insurance": 0.019492 },
        "84": { "without_insurance": 0.016462, "with_insurance": 0.017588 },
        "96": { "without_insurance": 0.014961, "with_insurance": 0.016216 },
        "108": { "without_insurance": 0.013804, "with_insurance": 0.015205 },
        "120": { "without_insurance": 0.012888, "with_insurance": 0.014453 }
      }
    },
    {
      "tin": 8.99,
      "coefficients": {
        "36": { "without_insurance": 0.033051, "with_insurance": 0.033799 },
        "48": { "without_insurance": 0.025863, "with_insurance": 0.026691 },
        "60": { "without_insurance": 0.021573, "with_insurance": 0.022494 },
        "72": { "without_insurance": 0.018732, "with_insurance": 0.019758 },
        "84": { "without_insurance": 0.016719, "with_insurance": 0.017863 },
        "96": { "without_insurance": 0.015223, "with_insurance": 0.016501 },
        "108": { "without_insurance": 0.014072, "with_insurance": 0.015500 },
        "120": { "without_insurance": 0.013162, "with_insurance": 0.014760 }
      }
    },
    {
      "tin": 9.50,
      "coefficients": {
        "36": { "without_insurance": 0.033298, "with_insurance": 0.034052 },
        "48": { "without_insurance": 0.026116, "with_insurance": 0.026951 },
        "60": { "without_insurance": 0.021831, "with_insurance": 0.022763 },
        "72": { "without_insurance": 0.018997, "with_insurance": 0.020037 },
        "84": { "without_insurance": 0.016990, "with_insurance": 0.018152 },
        "96": { "without_insurance": 0.015500, "with_insurance": 0.016801 },
        "108": { "without_insurance": 0.014355, "with_insurance": 0.015811 },
        "120": { "without_insurance": 0.013451, "with_insurance": 0.015084 }
      }
    },
    {
      "tin": 9.99,
      "coefficients": {
        "36": { "without_insurance": 0.033537, "with_insurance": 0.034296 },
        "48": { "without_insurance": 0.026359, "with_insurance": 0.027203 },
        "60": { "without_insurance": 0.022081, "with_insurance": 0.023023 },
        "72": { "without_insurance": 0.019252, "with_insurance": 0.020306 },
        "84": { "without_insurance": 0.017252, "with_insurance": 0.018432 },
        "96": { "without_insurance": 0.015768, "with_insurance": 0.017091 },
        "108": { "without_insurance": 0.014629, "with_insurance": 0.016114 },
        "120": { "without_insurance": 0.013731, "with_insurance": 0.015398 }
      }
    },
    {
      "tin": 10.50,
      "coefficients": {
        "72": { "without_insurance": 0.019521, "with_insurance": 0.020589 },
        "84": { "without_insurance": 0.017527, "with_insurance": 0.018726 },
        "96": { "without_insurance": 0.016050, "with_insurance": 0.017397 },
        "108": { "without_insurance": 0.014918, "with_insurance": 0.016431 },
        "120": { "without_insurance": 0.014026, "with_insurance": 0.015729 }
      }
    }
  ]
}'::jsonb
WHERE financing_table IS NULL;

