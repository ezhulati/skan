import { OrderStatus } from '../types';

interface OrderFiltersProps {
  activeFilter: OrderStatus | 'all';
  onFilterChange: (filter: OrderStatus | 'all') => void;
  orderCounts: {
    all: number;
    new: number;
    preparing: number;
    ready: number;
    served: number;
  };
}

const filters = [
  { key: 'all' as const, label: 'All Orders', color: 'border-gray-300 text-gray-700' },
  { key: 'new' as const, label: 'New', color: 'border-blue-300 text-blue-700' },
  { key: 'preparing' as const, label: 'Preparing', color: 'border-orange-300 text-orange-700' },
  { key: 'ready' as const, label: 'Ready', color: 'border-green-300 text-green-700' },
  { key: 'served' as const, label: 'Served', color: 'border-gray-300 text-gray-600' },
];

export function OrderFilters({ activeFilter, onFilterChange, orderCounts }: OrderFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = orderCounts[filter.key];
          
          return (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={`px-4 py-2 rounded-lg border-2 transition-all min-h-[44px] font-medium ${
                isActive
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : `bg-white hover:bg-gray-50 ${filter.color}`
              }`}
            >
              <span className="mr-2">{filter.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                isActive 
                  ? 'bg-white bg-opacity-20 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}