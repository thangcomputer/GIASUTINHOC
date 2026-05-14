/**
 * Đồng bộ với logic getSettings() trên server: nếu chưa có gói billingCycle === 'year'
 * thì sinh thêm các gói năm từ gói tháng (giá ~12×0,83, xu ~12×1,08).
 * Dùng trên client để luôn có dữ liệu Tháng/Năm khi API chưa cập nhật server.
 */
export function mergeCoinPackagesIfMissing(pkgs) {
  if (!Array.isArray(pkgs) || pkgs.length === 0) return pkgs;
  const hasYearTier = pkgs.some((p) => p.billingCycle === 'year');
  if (hasYearTier) return pkgs;

  const monthBase = pkgs.filter(
    (p) => (p.billingCycle || 'month') !== 'year' && !/^y\d+$/i.test(String(p.id || '').trim()),
  );
  if (monthBase.length === 0 || monthBase.length > 12) return pkgs;

  const monthSource = monthBase.map((p) => ({
    ...p,
    billingCycle: 'month',
  }));
  const yearAppend = monthSource.map((p, idx) => {
    const baseId = String(p.id ?? idx + 1);
    const srcPrice = Number(p.priceMs || 0);
    const priceMs =
      srcPrice <= 0 ? 0 : Math.max(1000, Math.round(srcPrice * 12 * 0.83));
    const srcCoins = Number(p.coins || 0);
    const coins =
      srcCoins <= 0 ? 0 : Math.max(1, Math.round(srcCoins * 12 * 1.08));
    const price = `${priceMs.toLocaleString('vi-VN')}₫`;
    return {
      ...p,
      id: `y${baseId}`,
      billingCycle: 'year',
      priceMs,
      coins,
      price,
      bonus: 'Tiết kiệm ~17% so với 12 tháng lẻ',
    };
  });
  return [...monthSource, ...yearAppend];
}
