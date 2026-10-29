import { z } from "zod";

export const camaraDeputySchema = z
  .object({
    id: z.number().int().positive(),
    uri: z.string().url(),
    nome: z.string().trim().min(1),
    siglaPartido: z.string().nullable().optional(),
    siglaUf: z.string().length(2).nullable().optional(),
    urlFoto: z.string().url().nullable().optional(),
  })
  .passthrough();

export const camaraDeputyListSchema = z.object({
  dados: z.array(camaraDeputySchema),
  links: z.array(
    z.object({
      rel: z.string(),
      href: z.string().url(),
    }),
  ),
});

export type CamaraDeputy = z.infer<typeof camaraDeputySchema>;
export type CamaraDeputyList = z.infer<typeof camaraDeputyListSchema>;
