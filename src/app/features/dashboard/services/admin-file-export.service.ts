import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminFileExportService {
  downloadCsv(fileName: string, headers: string[], rows: string[][]): void {
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => this.escapeCell(cell)).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  openPrintView(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private escapeCell(value: string): string {
    const normalized = String(value ?? '');
    if (/[",\r\n]/.test(normalized)) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }

    return normalized;
  }
}
