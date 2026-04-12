'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';

interface BankRate {
  bankName: string;
  bankSlug: string;
  bankType: string;
  tenure?: string;
  generalRate: number;
  seniorCitizenRate?: number | null;
}

interface BankRateTableProps {
  title: string;
  rates: BankRate[];
  showTenure?: boolean;
  rateLabel?: string;
}

type SortField = 'bankName' | 'generalRate' | 'seniorCitizenRate';
type SortOrder = 'asc' | 'desc';

export default function BankRateTable({
  title, rates, showTenure = true, rateLabel = 'Rate',
}: BankRateTableProps): React.ReactElement {
  const [sortField, setSortField] = useState<SortField>('generalRate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = useCallback((field: SortField): void => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField]);

  const sortedRates = useMemo(() => {
    return [...rates].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;
      if (sortField === 'bankName') { valA = a.bankName; valB = b.bankName; }
      else if (sortField === 'generalRate') { valA = a.generalRate; valB = b.generalRate; }
      else if (sortField === 'seniorCitizenRate') { valA = a.seniorCitizenRate ?? 0; valB = b.seniorCitizenRate ?? 0; }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [rates, sortField, sortOrder]);

  const SortArrow = ({ field }: { field: SortField }): React.ReactElement => (
    <span className="ml-1 text-xs">
      {sortField === field ? (sortOrder === 'asc' ? '\u25B2' : '\u25BC') : '\u25BC'}
    </span>
  );

  const bankTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      public: 'Public', private: 'Private', small_finance: 'Small Finance', cooperative: 'Co-op',
    };
    return map[type] ?? type;
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="heading-2 mb-4">{title}</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:text-primary" onClick={() => handleSort('bankName')}>
              Bank <SortArrow field="bankName" />
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
            {showTenure && <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tenure</th>}
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:text-primary" onClick={() => handleSort('generalRate')}>
              {rateLabel} <SortArrow field="generalRate" />
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:text-primary" onClick={() => handleSort('seniorCitizenRate')}>
              Senior Citizen <SortArrow field="seniorCitizenRate" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRates.map((rate, index) => (
            <tr key={`${rate.bankSlug}-${rate.tenure}-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <Link href={`/bank-rates/${rate.bankSlug}`} className="text-primary font-medium no-underline hover:underline">
                  {rate.bankName}
                </Link>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">{bankTypeLabel(rate.bankType)}</td>
              {showTenure && <td className="py-3 px-4 text-sm text-gray-700">{rate.tenure ?? '-'}</td>}
              <td className="py-3 px-4 text-right font-semibold text-gray-900">{rate.generalRate.toFixed(2)}%</td>
              <td className="py-3 px-4 text-right font-medium text-gray-700">
                {rate.seniorCitizenRate ? `${rate.seniorCitizenRate.toFixed(2)}%` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rates.length === 0 && (
        <p className="text-center py-8 text-gray-500">No rates available yet.</p>
      )}
    </div>
  );
}