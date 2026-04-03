import { prisma } from '../utils/prisma';

/**
 * DashboardService
 *
 * This service mimics a simplified cash-flow monitoring and analytics backend,
 * similar to what Zorvyn provides for SMEs. It aggregates financial records into
 * meaningful summaries for finance teams — covering KPIs, cash-flow timelines,
 * category breakdowns, and anomaly detection.
 */
export class DashboardService {
  /**
   * GET /api/v1/dashboard/summary
   * Returns high-level KPIs for the finance overview dashboard.
   * Aggregates total income, expense, refunds, fees, net balance, and recent activity.
   */
  async getSummary() {
    const activeRecords = { isDeleted: false };

    // Aggregate totals by transaction type
    const aggregates = await prisma.financialRecord.groupBy({
      by: ['type'],
      where: activeRecords,
      _sum: { amount: true },
      _count: { id: true },
    });

    const totals = { INCOME: 0, EXPENSE: 0, REFUND: 0, FEE: 0 };
    let recordCount = 0;

    for (const agg of aggregates) {
      totals[agg.type] = agg._sum.amount || 0;
      recordCount += agg._count.id;
    }

    const netBalance = totals.INCOME - totals.EXPENSE - totals.REFUND - totals.FEE;

    // Active categories
    const categoryGroups = await prisma.financialRecord.groupBy({
      by: ['category'],
      where: activeRecords,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const activeCategories = categoryGroups.map((c) => c.category);

    // Recent activity (last 15 records)
    const recentActivities = await prisma.financialRecord.findMany({
      where: activeRecords,
      orderBy: { date: 'desc' },
      take: 15,
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
        notes: true,
        status: true,
        channel: true,
      },
    });

    return {
      total_income: totals.INCOME,
      total_expense: totals.EXPENSE,
      total_refunds: totals.REFUND,
      total_fees: totals.FEE,
      net_balance: netBalance,
      record_count: recordCount,
      active_categories: activeCategories,
      recent_activities: recentActivities,
    };
  }

  /**
   * GET /api/v1/dashboard/cashflow
   * Returns monthly cash-flow breakdown — total income vs expense vs net.
   * Useful for finance managers to track burn rate and revenue trends.
   */
  async getCashflow(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - months + 1);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const records = await prisma.financialRecord.findMany({
      where: {
        isDeleted: false,
        date: { gte: since },
        type: { in: ['INCOME', 'EXPENSE'] },
      },
      select: { amount: true, type: true, date: true },
      orderBy: { date: 'asc' },
    });

    // Group by year-month
    const monthMap: Record<string, { total_income: number; total_expense: number }> = {};

    for (const r of records) {
      const key = r.date.toISOString().slice(0, 7); // "2026-03"
      if (!monthMap[key]) monthMap[key] = { total_income: 0, total_expense: 0 };

      if (r.type === 'INCOME') monthMap[key].total_income += r.amount;
      else if (r.type === 'EXPENSE') monthMap[key].total_expense += r.amount;
    }

    const monthly = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        total_income: Math.round(data.total_income * 100) / 100,
        total_expense: Math.round(data.total_expense * 100) / 100,
        net: Math.round((data.total_income - data.total_expense) * 100) / 100,
        is_deficit: data.total_income < data.total_expense,
      }));

    // Weekly breakdown for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthRecords = await prisma.financialRecord.findMany({
      where: {
        isDeleted: false,
        date: { gte: startOfMonth },
        type: { in: ['INCOME', 'EXPENSE'] },
      },
      select: { amount: true, type: true, date: true },
    });

    const weekMap: Record<string, { total_income: number; total_expense: number }> = {};
    for (const r of thisMonthRecords) {
      const day = r.date.getDate();
      const week = `Week ${Math.ceil(day / 7)}`;
      if (!weekMap[week]) weekMap[week] = { total_income: 0, total_expense: 0 };
      if (r.type === 'INCOME') weekMap[week].total_income += r.amount;
      else if (r.type === 'EXPENSE') weekMap[week].total_expense += r.amount;
    }

    const weekly = Object.entries(weekMap).map(([week, data]) => ({
      week,
      total_income: Math.round(data.total_income * 100) / 100,
      total_expense: Math.round(data.total_expense * 100) / 100,
      net: Math.round((data.total_income - data.total_expense) * 100) / 100,
    }));

    return { monthly, weekly };
  }

  /**
   * GET /api/v1/dashboard/categories
   * Returns income and expense totals grouped by category.
   * Allows finance analysts to see where money flows in/out.
   */
  async getCategoryBreakdown() {
    const records = await prisma.financialRecord.groupBy({
      by: ['type', 'category'],
      where: { isDeleted: false },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const incomes_by_category: Record<string, number> = {};
    const expenses_by_category: Record<string, number> = {};
    const refunds_by_category: Record<string, number> = {};
    const fees_by_category: Record<string, number> = {};

    for (const r of records) {
      const amount = Math.round((r._sum.amount || 0) * 100) / 100;
      if (r.type === 'INCOME') incomes_by_category[r.category] = amount;
      else if (r.type === 'EXPENSE') expenses_by_category[r.category] = amount;
      else if (r.type === 'REFUND') refunds_by_category[r.category] = amount;
      else if (r.type === 'FEE') fees_by_category[r.category] = amount;
    }

    // Channel distribution
    const channelGroups = await prisma.financialRecord.groupBy({
      by: ['channel'],
      where: { isDeleted: false },
      _sum: { amount: true },
      _count: { id: true },
    });

    const by_channel = channelGroups.map((c) => ({
      channel: c.channel,
      total_amount: Math.round((c._sum.amount || 0) * 100) / 100,
      transaction_count: c._count.id,
    }));

    return {
      incomes_by_category,
      expenses_by_category,
      refunds_by_category,
      fees_by_category,
      by_channel,
    };
  }

  /**
   * GET /api/v1/dashboard/anomalies
   *
   * Zorvyn-style fraud-monitoring-lite endpoint.
   * Flags:
   *   1. High-amount transactions (above 90th percentile)
   *   2. Month-over-month expense spike (>30% increase)
   *   3. Unusually high refund rate
   *   4. Transactions with REVERSED status
   */
  async getAnomalies() {
    const activeRecords = { isDeleted: false };

    // ── 1. High-amount transactions (P90) ─────────────────────────────────────
    const allAmounts = await prisma.financialRecord.findMany({
      where: activeRecords,
      select: { amount: true },
      orderBy: { amount: 'asc' },
    });

    let highAmountTransactions: unknown[] = [];
    if (allAmounts.length > 0) {
      const amounts = allAmounts.map((r) => r.amount).sort((a, b) => a - b);
      const p90Index = Math.floor(amounts.length * 0.9);
      const p90Threshold = amounts[p90Index];

      highAmountTransactions = await prisma.financialRecord.findMany({
        where: { ...activeRecords, amount: { gte: p90Threshold } },
        orderBy: { amount: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          date: true,
          notes: true,
          channel: true,
          status: true,
        },
      });
    }

    // ── 2. Month-over-month expense spike ────────────────────────────────────
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [currentMonthExpense, prevMonthExpense] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { ...activeRecords, type: 'EXPENSE', date: { gte: currentMonthStart } },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: {
          ...activeRecords,
          type: 'EXPENSE',
          date: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const currExp = currentMonthExpense._sum.amount || 0;
    const prevExp = prevMonthExpense._sum.amount || 0;
    const expenseChangePercent = prevExp > 0
      ? Math.round(((currExp - prevExp) / prevExp) * 100)
      : 0;

    const expenseSpike = {
      prev_month_expense: Math.round(prevExp * 100) / 100,
      current_month_expense: Math.round(currExp * 100) / 100,
      change_percentage: expenseChangePercent,
      is_spike: expenseChangePercent > 30,
    };

    // ── 3. Refund rate (refunds / income) ────────────────────────────────────
    const [totalIncome, totalRefunds] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { ...activeRecords, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: { ...activeRecords, type: 'REFUND' },
        _sum: { amount: true },
      }),
    ]);

    const incomeAmt = totalIncome._sum.amount || 0;
    const refundAmt = totalRefunds._sum.amount || 0;
    const refundRate = incomeAmt > 0 ? Math.round((refundAmt / incomeAmt) * 10000) / 100 : 0;

    // ── 4. Reversed transactions ──────────────────────────────────────────────
    const reversedTransactions = await prisma.financialRecord.findMany({
      where: { ...activeRecords, status: 'REVERSED' },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
        notes: true,
      },
    });

    return {
      high_amount_transactions: highAmountTransactions,
      expense_spike: expenseSpike,
      refund_analysis: {
        total_refunds: Math.round(refundAmt * 100) / 100,
        total_income: Math.round(incomeAmt * 100) / 100,
        refund_rate_percent: refundRate,
        is_high_refund_rate: refundRate > 5,
      },
      reversed_transactions: reversedTransactions,
      anomaly_count:
        (highAmountTransactions.length > 0 ? 1 : 0) +
        (expenseSpike.is_spike ? 1 : 0) +
        (refundRate > 5 ? 1 : 0) +
        (reversedTransactions.length > 0 ? 1 : 0),
    };
  }
}

export const dashboardService = new DashboardService();
