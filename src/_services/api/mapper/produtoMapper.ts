import type { ProdutoDto } from '../model/produtoDto';
import type { CreateProdutoDto } from '../model/createProdutoDto';

/** Maps API ProdutoDto to CreateProdutoDto (store type) - fills optional fields with defaults */
export function mapProdutoDtoToCreate(p: ProdutoDto): CreateProdutoDto {
  return {
    codDum: p.codDum ?? '',
    codEan: p.codEan ?? '',
    sku: p.sku,
    descricao: p.descricao,
    shelf: p.shelf,
    pesoLiquidoCaixa: p.pesoLiquidoCaixa,
    pesoLiquidoUnidade: p.pesoLiquidoUnidade,
    unPorCaixa: p.unPorCaixa,
    caixaPorPallet: p.caixaPorPallet,
    segmento: String(p.segmento),
    empresa: String(p.empresa),
    criadoEm: p.criadoEm ?? '',
  };
}
