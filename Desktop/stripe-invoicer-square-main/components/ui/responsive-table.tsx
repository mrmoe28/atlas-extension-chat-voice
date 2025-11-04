/**
 * RESPONSIVE: ResponsiveTable Component
 *
 * Renders as a normal table on desktop (md+)
 * Collapses to card layout on mobile (<md)
 *
 * @example
 * <ResponsiveTable
 *   headers={["Name", "Email", "Status"]}
 *   data={[
 *     { id: "1", name: "John", email: "john@example.com", status: "Active" }
 *   ]}
 *   renderRow={(item) => (
 *     <>
 *       <TableCell>{item.name}</TableCell>
 *       <TableCell>{item.email}</TableCell>
 *       <TableCell>{item.status}</TableCell>
 *     </>
 *   )}
 *   renderCard={(item) => (
 *     <div className="space-y-2">
 *       <div className="flex justify-between">
 *         <span className="font-medium">Name:</span>
 *         <span>{item.name}</span>
 *       </div>
 *     </div>
 *   )}
 * />
 */

"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

interface ResponsiveTableProps<T> {
  headers: string[];
  data: T[];
  renderRow: (item: T) => React.ReactNode;
  renderCard: (item: T) => React.ReactNode;
  getKey: (item: T) => string | number;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  headers,
  data,
  renderRow,
  renderCard,
  getKey,
  emptyMessage = "No data available",
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* RESPONSIVE: Mobile card view */}
      <div className="block space-y-3 md:hidden">
        {data.length === 0 ? (
          <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          data.map((item) => (
            <div key={getKey(item)} className="rounded-lg border border-border p-3">
              {renderCard(item)}
            </div>
          ))
        )}
      </div>

      {/* RESPONSIVE: Desktop table view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length} className="text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => <TableRow key={getKey(item)}>{renderRow(item)}</TableRow>)
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
