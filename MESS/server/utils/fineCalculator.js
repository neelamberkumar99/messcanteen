const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculate fine based on dueDate, fineRules (array of slabs), and currentDate.
 * slabs: [{ fromDay, toDay, perDayFine }]
 * Returns { totalFine, breakdown: [{ slab, days, fineAmount }] }
 */
function calculateFine(dueDate, fineRules = [], currentDate = new Date()) {
	if (!dueDate) return { totalFine: 0, breakdown: [] };
	const due = new Date(dueDate);
	const now = new Date(currentDate);

	// If not overdue
	const diffMs = now.setHours(0,0,0,0) - due.setHours(0,0,0,0);
	const daysOverdue = Math.max(0, Math.floor(diffMs / MS_PER_DAY));
	if (daysOverdue === 0) return { totalFine: 0, breakdown: [] };

	// Normalize slabs: sort by fromDay asc
	const slabs = Array.isArray(fineRules) ? [...fineRules] : [];
	slabs.sort((a, b) => (a.fromDay - b.fromDay));

	if (slabs.length === 0) return { totalFine: 0, breakdown: [] };

	let remaining = daysOverdue;
	let totalFine = 0;
	const breakdown = [];

	for (const slab of slabs) {
		const slabFrom = Math.max(0, slab.fromDay || 0);
		const slabTo = typeof slab.toDay === 'number' ? slab.toDay : Infinity;
		// Determine overlap between [1..daysOverdue] and [slabFrom..slabTo]
		const start = Math.max(1, slabFrom);
		const end = slabTo;
		if (start > daysOverdue) break;
		const effectiveEnd = Math.min(daysOverdue, end);
		if (effectiveEnd < start) continue;
		const daysInSlab = effectiveEnd - start + 1;
		const fineAmount = daysInSlab * (slab.perDayFine || 0);
		totalFine += fineAmount;
		breakdown.push({ slab: { fromDay: slabFrom, toDay: slabTo, perDayFine: slab.perDayFine }, days: daysInSlab, fineAmount });
	}

	return { totalFine, breakdown, daysOverdue };
}

module.exports = { calculateFine };
