import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      let cell = row[header];
      if (cell === null || cell === undefined) {
        cell = "";
      } else {
        // Handle objects by serializing them to JSON string
        if (typeof cell === 'object') {
          cell = JSON.stringify(cell);
        }
        const cellString = String(cell);
        // Escape commas and quotes
        const escaped = cellString.replace(/"/g, '""');
        if (escaped.includes(',')) {
          return `"${escaped}"`;
        }
        return escaped;
      }
      return cell;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export function downloadCSV(csvString: string, filename: string) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
