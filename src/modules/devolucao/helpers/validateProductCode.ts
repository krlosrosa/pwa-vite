import type { ProdutoItem } from '@/_shared/stores/produtoStore';

/**
 * Helper function to validate product code (SKU, EAN, or DUM)
 * and return the SKU if the code matches a product
 * 
 * @param code - The code entered by the user (SKU, EAN, or DUM)
 * @param produtos - Record of all products indexed by SKU
 * @param expectedSku - The expected SKU that should match
 * @returns The SKU if code is valid and matches expected SKU, null otherwise
 */
export function validateProductCode(
  code: string,
  produtos: Record<string, ProdutoItem>,
  expectedSku: string
): string | null {
  if (!code || !code.trim() || !expectedSku || !expectedSku.trim()) {
    console.log('[validateProductCode] Empty code or expectedSku');
    return null;
  }

  const normalizedCode = code.trim().toUpperCase();
  const normalizedExpectedSku = expectedSku.trim().toUpperCase();

  console.log('[validateProductCode] Input:', {
    code: `"${code}"`,
    codeLength: code.length,
    codeTrimmed: `"${code.trim()}"`,
    normalizedCode: `"${normalizedCode}"`,
    expectedSku: `"${expectedSku}"`,
    expectedSkuLength: expectedSku.length,
    expectedSkuTrimmed: `"${expectedSku.trim()}"`,
    normalizedExpectedSku: `"${normalizedExpectedSku}"`,
    produtosCount: Object.keys(produtos).length,
  });

  // First, try direct match with expected SKU (fastest path)
  if (normalizedCode === normalizedExpectedSku) {
    console.log('[validateProductCode] Direct SKU match!');
    return expectedSku;
  }

  // Search through all products for EAN or DUM match
  for (const produto of Object.values(produtos)) {
    if (!produto.sku) continue; // Skip products without SKU

    const produtoSku = produto.sku.trim().toUpperCase();
    const produtoEan = produto.codEan?.trim().toUpperCase() || '';
    const produtoDum = produto.codDum?.trim().toUpperCase() || '';

    // Check if the entered code matches any of the product codes
    if (
      normalizedCode === produtoSku ||
      (produtoEan && normalizedCode === produtoEan) ||
      (produtoDum && normalizedCode === produtoDum)
    ) {
      console.log('[validateProductCode] Found matching product:', {
        produtoSku: `"${produto.sku}"`,
        produtoEan: `"${produto.codEan}"`,
        produtoDum: `"${produto.codDum}"`,
        matchesExpected: produtoSku === normalizedExpectedSku,
      });

      // If it matches, verify it's the expected product
      if (produtoSku === normalizedExpectedSku) {
        console.log('[validateProductCode] Product matches expected SKU!');
        return produto.sku; // Return the original SKU (not normalized)
      } else {
        console.log('[validateProductCode] Product found but SKU does not match expected');
      }
    }
  }

  console.log('[validateProductCode] No matching product found');
  return null;
}
