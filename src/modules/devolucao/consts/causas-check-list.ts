export type NaturezaAnomalia = 'comercial' | 'logistica' | 'unidadeProdutora' | 'transporte';

export type TipoNaoConformidade =
  | 'amassado'
  | 'furado'
  | 'estufado'
  | 'rasgado'
  | 'sujo'
  | 'mofado'
  | 'maApresentacao'
  | 'foraDeTemperatura'
  | 'dataDivergente'
  | 'coalhado'
  | 'vazia'
  | 'vencido'
  | 'contQuebrado'
  | 'quebrado'
  | 'seloDescolando'
  | 'faltaUnidade'
  | 'faltaCaixa'
  | 'faltaPeso'
  | 'sobra';

export interface CausaAvaria {
  causaAvaria: string;
  naturezaAnomalia: NaturezaAnomalia;
}

export const causasAvarias: CausaAvaria[] = [
  { causaAvaria: "1. Carga Pisoteada", naturezaAnomalia: "logistica" },
  { causaAvaria: "2. Corrente", naturezaAnomalia: "logistica" },
  { causaAvaria: "3. Lona furada", naturezaAnomalia: "logistica" },
  { causaAvaria: "4. Falta de forro", naturezaAnomalia: "logistica" },
  { causaAvaria: "5. Lasca de madeira", naturezaAnomalia: "logistica" },
  { causaAvaria: "6. Assoalho quebrado", naturezaAnomalia: "logistica" },
  { causaAvaria: "7. Freada brusca (conformidade pelo motorista)", naturezaAnomalia: "logistica" },
  { causaAvaria: "8. Fueiro", naturezaAnomalia: "logistica" },
  { causaAvaria: "9. Prego na carroceria", naturezaAnomalia: "logistica" },
  { causaAvaria: "10. Ganchos", naturezaAnomalia: "logistica" },
  { causaAvaria: "11. Materiais sobre produtos", naturezaAnomalia: "logistica" },
  { causaAvaria: "12. Pallets tombados", naturezaAnomalia: "logistica" },
  { causaAvaria: "13. Tampas Laterais (Quebrada/Rachada)", naturezaAnomalia: "logistica" },
  { causaAvaria: "14. Falha/Quebra no Equip. de Frio", naturezaAnomalia: "logistica" },
  { causaAvaria: "15. Corda", naturezaAnomalia: "logistica" },
  { causaAvaria: "16. Condições da estrada", naturezaAnomalia: "logistica" },
  { causaAvaria: "17. Presença de Pragas / Roedores", naturezaAnomalia: "logistica" },
  { causaAvaria: "18. Molhado pelo sistema do frio", naturezaAnomalia: "logistica" },
  { causaAvaria: "19. Falta de Higiene", naturezaAnomalia: "logistica" },
  { causaAvaria: "20. Parede, teto e vedação fora do padrão", naturezaAnomalia: "logistica" },
  { causaAvaria: "21. Umidade", naturezaAnomalia: "logistica" },
  { causaAvaria: "22. Manuseio inadequado", naturezaAnomalia: "logistica" },
  { causaAvaria: "23. Lacre rompido", naturezaAnomalia: "logistica" },
  { causaAvaria: "24. Carga corrida", naturezaAnomalia: "logistica" },
  { causaAvaria: "25. Presença de produto químico", naturezaAnomalia: "logistica" },
  { causaAvaria: "26. Falta/ausência de produtos", naturezaAnomalia: "logistica" },
  { causaAvaria: "27. Outros (especificar no Parecer logistica)", naturezaAnomalia: "logistica" },
  { causaAvaria: "50-Mau Paletizado/Palete Misto", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "51-Sem Cantoneira", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "52-Stretch Apertado de Falta e Sobra) de Falta e Sobra)", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "53-Stretch Frouxo/Pouco Stretch", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "54-Ausência de Filme na Base", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "55-Nº Maior de Lastros", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "56-Divergência Embalagem Secundária", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "57-Datação Divergente", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "58-Má Formação da Embalagem", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "59-Avariado pela Esteira (embalagem primária)", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "60-Corte Vertical na embalagem primária", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "61-Defeito na Selagem Longitudinal/Transversal", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "62-Excesso de Temperatura na Selagem das Abas", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "63-Aba Dobrada", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "64-Resíduo de Material de Embalagem", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "65-Desvio de Produção", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "66-Resistência da embalagem", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "67-Molhado de produto (vazamento)", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "68-Data apagada/borrada", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "69-Embalagem sem data de fabricação", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "70-Embalagem sem código de barras", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "71-Aba aberta (embalagem primária)", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "72-Aba aberta (embalagem secundária)", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "73-Defeito na selagem da embalagem", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "74-Falha no DINC", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "1 - Carga Pisoteada", naturezaAnomalia: "transporte" },
  { causaAvaria: "2 - Corrente", naturezaAnomalia: "transporte" },
  { causaAvaria: "3 - Lona furada", naturezaAnomalia: "transporte" },
  { causaAvaria: "4 - Falta de forro", naturezaAnomalia: "transporte" },
  { causaAvaria: "5 - Lasca de madeira", naturezaAnomalia: "transporte" },
  { causaAvaria: "6 - Assoalho quebrado", naturezaAnomalia: "transporte" },
  { causaAvaria: "7 - Freada brusca (conformidado pelo motorist", naturezaAnomalia: "transporte" },
  { causaAvaria: "8 - Fueiro", naturezaAnomalia: "transporte" },
  { causaAvaria: "9 - Prego na carroceria", naturezaAnomalia: "transporte" },
  { causaAvaria: "10 - Ganchos", naturezaAnomalia: "transporte" },
  { causaAvaria: "11 - Materiais sobre produtos", naturezaAnomalia: "transporte" },
  { causaAvaria: "12 - Pallets tombados", naturezaAnomalia: "transporte" },
  { causaAvaria: "13 - Tampas Laterais (Quebrada/Rachada)", naturezaAnomalia: "transporte" },
  { causaAvaria: "14 - Falha/Quebra no Equip. de Frio", naturezaAnomalia: "transporte" },
  { causaAvaria: "15 - Corda", naturezaAnomalia: "transporte" },
  { causaAvaria: "16 - Condições da estrada", naturezaAnomalia: "transporte" },
  { causaAvaria: "17 - Presença de Pragas / Roedores", naturezaAnomalia: "transporte" },
  { causaAvaria: "18 - Molhado pelo sistema do frio", naturezaAnomalia: "transporte" },
  { causaAvaria: "19 - Falta de Higiene", naturezaAnomalia: "transporte" },
  { causaAvaria: "20 - Parede, teto e vedação fora do padrão", naturezaAnomalia: "transporte" },
  { causaAvaria: "21 - Umidade", naturezaAnomalia: "transporte" },
  { causaAvaria: "22 - Manuseio inadequado", naturezaAnomalia: "transporte" },
  { causaAvaria: "23 - Lacre rompido", naturezaAnomalia: "transporte" },
  { causaAvaria: "24 - Carga corrida", naturezaAnomalia: "transporte" },
  { causaAvaria: "25 - Presença de produto químico", naturezaAnomalia: "transporte" },
  { causaAvaria: "26 - Falta/ausência de produtos", naturezaAnomalia: "transporte" },
  { causaAvaria: "27 - Outros (especificar no Parecer logistica)", naturezaAnomalia: "transporte" },
  { causaAvaria: "75 - Falha na Fita", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "76 - Troca de Fita", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "77 - Troca de bobina", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "78 - Má formação da tampa", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "79 - Danificado na cardboard", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "80 - Dobradora final", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "81 - Microfuro", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "82 - Emenda do filme", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "83 - Riscos na embalagem", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "84 - Reinicio/Parada de máquina", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "85 - Zona de Risco", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "86 - Queda do robo", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "87 - Triagem do robo", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "88 - Falta de unidade em caixa/fardo lacrado", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "89 - Falha na tampa", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "90 - Embalagem sem tampa", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "91 - Avariado pela Esteira que transporta o pallet", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "92 - Outros (especificar)", naturezaAnomalia: "unidadeProdutora" },
  { causaAvaria: "93 - Danificado no depósito do cliente", naturezaAnomalia: "comercial" },
  { causaAvaria: "94 - Vencido no depósito do cliente", naturezaAnomalia: "comercial" },
  { causaAvaria: "95 - Vencido no depósito Lactalis", naturezaAnomalia: "comercial" },
  { causaAvaria: "96 - Temperatura Inadequada no cliente", naturezaAnomalia: "comercial" },
  { causaAvaria: "97 - Ataque de pragas / Roedores no cliente", naturezaAnomalia: "comercial" }
]

export const naturezaAnomaliaOptions: { value: NaturezaAnomalia; label: string }[] = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'logistica', label: 'Logística' },
  { value: 'unidadeProdutora', label: 'Unidade Produtora' },
  { value: 'transporte', label: 'Transporte' },
];

export const tipoNaoConformidadeOptions: { value: TipoNaoConformidade; label: string }[] = [
  { value: 'amassado', label: 'Amassado' },
  { value: 'furado', label: 'Furado' },
  { value: 'estufado', label: 'Estufado' },
  { value: 'rasgado', label: 'Rasgado' },
  { value: 'sujo', label: 'Sujo' },
  { value: 'mofado', label: 'Mofado' },
  { value: 'maApresentacao', label: 'Má Apresentação' },
  { value: 'foraDeTemperatura', label: 'Fora de Temperatura' },
  { value: 'dataDivergente', label: 'Data Divergente' },
  { value: 'coalhado', label: 'Coalhado' },
  { value: 'vazia', label: 'Vazia' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'contQuebrado', label: 'Container Quebrado' },
  { value: 'quebrado', label: 'Quebrado' },
  { value: 'seloDescolando', label: 'Selo Descolando' },
  { value: 'faltaUnidade', label: 'Falta Unidade' },
  { value: 'faltaCaixa', label: 'Falta Caixa' },
  { value: 'faltaPeso', label: 'Falta Peso' },
  { value: 'sobra', label: 'Sobra' },
];

export function getCausasByNatureza(natureza: NaturezaAnomalia): CausaAvaria[] {
  return causasAvarias.filter((causa) => causa.naturezaAnomalia === natureza);
}