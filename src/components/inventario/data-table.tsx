'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '../ui/skeleton';

interface DataTableProps<TData, TValue> {
  columns: {
    accessorKey: string;
    header: string;
    cell: (props: { row: { original: TData } }) => React.ReactNode;
  }[];
  data: TData[];
  isLoading: boolean;
  highlightedRowId?: string | null;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  highlightedRowId,
}: DataTableProps<TData, TValue>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessorKey}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={column.accessorKey}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data?.length ? (
            data.map((row: any) => (
              <TableRow
                key={row.id}
                data-state={highlightedRowId === row.id ? 'selected' : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.accessorKey}>
                    {column.cell({ row: { original: row } })}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No hay resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
