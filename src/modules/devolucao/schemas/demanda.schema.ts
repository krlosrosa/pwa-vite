import { z } from "zod";

export const demandaSchema = z.object({
  id: z.string(),
  placa: z.string(),
  doca: z.string(),
  pin: z.string().optional(),
}).refine(
  (data) => {
    if (data.pin) {
      return data.pin.length === 4 && /^\d{4}$/.test(data.pin)
    }
    return true
  },
  {
    message: 'PIN deve conter exatamente 4 dígitos',
    path: ['pin'],
  }
)