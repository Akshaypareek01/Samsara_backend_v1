/**
 * Shared fee / tax / deduction calculations for booking trainer invoices.
 */

/**
 * Round currency to 2 decimal places.
 *
 * @param {number} value - Raw amount.
 * @returns {number}
 */
export function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

/**
 * Compute tax amount from base and tax config row.
 *
 * @param {number} baseAmount - Taxable base.
 * @param {{ rate?: number, type?: string, amount?: number }} tax - Tax row.
 * @returns {number}
 */
export function computeTaxAmount(baseAmount, tax) {
    if (!tax) return 0;
    const rate = Number(tax.rate) || 0;
    if (rate <= 0 && !(Number(tax.amount) > 0)) return 0;
    if (tax.type === 'fixed') {
        return roundMoney(tax.amount || 0);
    }
    return roundMoney((baseAmount * rate) / 100);
}

/**
 * Build a trainer fee line with GST, other taxes, and deductions.
 *
 * @param {Object} input - Line input.
 * @param {number} input.baseFee - Trainer service fee before tax.
 * @param {number} [input.gstRate=18] - GST percentage.
 * @param {Array<Object>} [input.otherTaxes] - Additional tax rows.
 * @param {Array<Object>} [input.deductions] - Flat deduction rows.
 * @returns {Object} Calculated line with amounts.
 */
export function buildTrainerFeeLine(input) {
    const baseFee = roundMoney(input.baseFee);
    const gstRate = Number(input.gstRate) || 0;
    const gstAmount = roundMoney((baseFee * gstRate) / 100);

    const otherTaxes = (input.otherTaxes || []).map((tax) => {
        const amount = computeTaxAmount(baseFee, tax);
        return {
            name: tax.name || 'Tax',
            rate: Number(tax.rate) || 0,
            type: tax.type === 'fixed' ? 'fixed' : 'percentage',
            amount,
        };
    });

    const deductions = (input.deductions || []).map((d) => ({
        name: d.name || 'Deduction',
        amount: roundMoney(d.amount),
    }));

    const totalOtherTaxes = roundMoney(otherTaxes.reduce((sum, t) => sum + t.amount, 0));
    const totalDeductions = roundMoney(deductions.reduce((sum, d) => sum + d.amount, 0));
    const grossAmount = roundMoney(baseFee + gstAmount + totalOtherTaxes);
    const netPayable = roundMoney(Math.max(0, grossAmount - totalDeductions));

    return {
        baseFee,
        gstRate,
        gstAmount,
        otherTaxes,
        totalOtherTaxes,
        deductions,
        totalDeductions,
        grossAmount,
        netPayable,
    };
}

/**
 * Aggregate totals across trainer fee lines.
 *
 * @param {Array<Object>} lines - Calculated trainer lines.
 * @returns {Object}
 */
export function aggregateTrainerFeeTotals(lines) {
    const totals = {
        baseFee: 0,
        gstAmount: 0,
        totalOtherTaxes: 0,
        totalDeductions: 0,
        grossAmount: 0,
        netPayable: 0,
    };

    for (const line of lines) {
        totals.baseFee += line.baseFee || 0;
        totals.gstAmount += line.gstAmount || 0;
        totals.totalOtherTaxes += line.totalOtherTaxes || 0;
        totals.totalDeductions += line.totalDeductions || 0;
        totals.grossAmount += line.grossAmount || 0;
        totals.netPayable += line.netPayable || 0;
    }

    Object.keys(totals).forEach((k) => {
        totals[k] = roundMoney(totals[k]);
    });

    return totals;
}
