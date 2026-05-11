import { Injectable } from '@angular/core';

import type { AdminDashboardReportData } from '../models/admin-view.model';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardReportService {
  async exportReport(report: AdminDashboardReportData): Promise<void> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const document = new jsPDF({
      unit: 'pt',
      format: 'a4',
    });
    const pdfDocument = document as typeof document & {
      lastAutoTable?: {
        finalY?: number;
      };
    };
    const generatedAt = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date());

    let cursorY = 48;

    document.setFont('helvetica', 'bold');
    document.setFontSize(18);
    document.text(report.title, 40, cursorY);

    cursorY += 18;
    document.setFont('helvetica', 'normal');
    document.setFontSize(10);
    document.setTextColor(82, 82, 91);
    document.text(`Generated: ${generatedAt}`, 40, cursorY);

    cursorY += 14;
    document.text(`Active filter: ${report.filterLabel} (${report.filterDescription})`, 40, cursorY);

    cursorY = this.renderMetricsTable(document, report.metrics, 'Main KPIs', cursorY, autoTable, pdfDocument);
    cursorY = this.renderChartSummaries(document, report.chartSummaries, cursorY, autoTable, pdfDocument);
    cursorY = this.renderTables(document, report.tables, cursorY, autoTable, pdfDocument);

    for (const section of report.sections ?? []) {
      cursorY += 24;
      document.setFont('helvetica', 'bold');
      document.setFontSize(14);
      document.setTextColor(17, 24, 39);
      document.text(section.title, 40, cursorY);

      if (section.description) {
        cursorY += 14;
        document.setFont('helvetica', 'normal');
        document.setFontSize(10);
        document.setTextColor(82, 82, 91);
        document.text(section.description, 40, cursorY, {
          maxWidth: 500,
        });
      }

      if (section.availabilityMessage) {
        cursorY += 18;
        document.setFont('helvetica', 'italic');
        document.setFontSize(10);
        document.setTextColor(120, 53, 15);
        document.text(section.availabilityMessage, 40, cursorY, {
          maxWidth: 500,
        });
      }

      cursorY = this.renderMetricsTable(
        document,
        section.metrics ?? [],
        `${section.title} Metrics`,
        cursorY,
        autoTable,
        pdfDocument,
        false,
      );
      cursorY = this.renderChartSummaries(
        document,
        section.chartSummaries ?? [],
        cursorY,
        autoTable,
        pdfDocument,
      );
      cursorY = this.renderTables(document, section.tables ?? [], cursorY, autoTable, pdfDocument);
    }

    if (report.notes.length > 0) {
      cursorY += 24;
      document.setFont('helvetica', 'bold');
      document.setFontSize(13);
      document.setTextColor(17, 24, 39);
      document.text('Notes', 40, cursorY);

      document.setFont('helvetica', 'normal');
      document.setFontSize(10);
      document.setTextColor(63, 63, 70);

      for (const note of report.notes) {
        cursorY += 16;
        document.text(`- ${note}`, 48, cursorY, {
          maxWidth: 500,
        });
      }
    }

    document.save(this.buildFileName(report));
  }

  async exportOverviewReport(report: AdminDashboardReportData): Promise<void> {
    await this.exportReport(report);
  }

  private renderMetricsTable(
    document: {
      setTextColor: (r: number, g: number, b: number) => void;
      setFont: (fontName: string, fontStyle: string) => void;
      setFontSize: (size: number) => void;
      text: (text: string, x: number, y: number) => void;
    },
    metrics: AdminDashboardReportData['metrics'],
    title: string,
    cursorY: number,
    autoTable: (
      documentRef: unknown,
      config: Record<string, unknown>,
    ) => void,
    pdfDocument: {
      lastAutoTable?: {
        finalY?: number;
      };
    },
    renderTitle = true,
  ): number {
    if (metrics.length === 0) {
      return cursorY;
    }

    if (renderTitle) {
      cursorY += 24;
      document.setTextColor(17, 24, 39);
      document.setFont('helvetica', 'bold');
      document.setFontSize(13);
      document.text(title, 40, cursorY);
    }

    autoTable(document, {
      startY: cursorY + 10,
      head: [['Metric', 'Value', 'Context']],
      body: metrics.map((metric) => [metric.label, metric.value, metric.change ?? '']),
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 6,
      },
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [15, 15, 16],
      },
      margin: {
        left: 40,
        right: 40,
      },
    });

    return pdfDocument.lastAutoTable?.finalY ?? cursorY;
  }

  private renderChartSummaries(
    document: {
      setFont: (fontName: string, fontStyle: string) => void;
      setFontSize: (size: number) => void;
      setTextColor: (r: number, g: number, b: number) => void;
      text: (text: string, x: number, y: number, options?: { maxWidth?: number }) => void;
    },
    charts: AdminDashboardReportData['chartSummaries'],
    cursorY: number,
    autoTable: (
      documentRef: unknown,
      config: Record<string, unknown>,
    ) => void,
    pdfDocument: {
      lastAutoTable?: {
        finalY?: number;
      };
    },
  ): number {
    for (const chart of charts) {
      cursorY += 24;
      document.setFont('helvetica', 'bold');
      document.setFontSize(13);
      document.setTextColor(17, 24, 39);
      document.text(chart.title, 40, cursorY);

      cursorY += 14;
      document.setFont('helvetica', 'normal');
      document.setFontSize(10);
      document.setTextColor(82, 82, 91);
      document.text(chart.subtitle, 40, cursorY, {
        maxWidth: 500,
      });

      autoTable(document, {
        startY: cursorY + 10,
        head: [['Summary', 'Value']],
        body: chart.summary.map((item) => [item.label, item.value]),
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 6,
        },
        headStyles: {
          fillColor: [24, 24, 27],
          textColor: [255, 255, 255],
        },
        margin: {
          left: 40,
          right: 40,
        },
      });

      cursorY = pdfDocument.lastAutoTable?.finalY ?? cursorY;

      if (chart.series.labels.length === 0) {
        continue;
      }

      autoTable(document, {
        startY: cursorY + 10,
        head: [['Date', 'Value']],
        body: chart.series.labels.map((label, index) => [
          label,
          String(chart.series.values[index] ?? 0),
        ]),
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [244, 244, 245],
          textColor: [17, 24, 39],
        },
        margin: {
          left: 40,
          right: 40,
        },
      });

      cursorY = pdfDocument.lastAutoTable?.finalY ?? cursorY;
    }

    return cursorY;
  }

  private renderTables(
    document: {
      setFont: (fontName: string, fontStyle: string) => void;
      setFontSize: (size: number) => void;
      setTextColor: (r: number, g: number, b: number) => void;
      text: (text: string, x: number, y: number) => void;
    },
    tables: AdminDashboardReportData['tables'],
    cursorY: number,
    autoTable: (
      documentRef: unknown,
      config: Record<string, unknown>,
    ) => void,
    pdfDocument: {
      lastAutoTable?: {
        finalY?: number;
      };
    },
  ): number {
    for (const table of tables) {
      const rows = table.rows.length > 0 ? table.rows : [[table.emptyMessage ?? 'No data available.', '']];
      const columns =
        table.rows.length > 0
          ? table.columns
          : [table.title, ''];

      autoTable(document, {
        startY: cursorY + 24,
        head: [columns],
        body: rows,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [24, 24, 27],
          textColor: [255, 255, 255],
        },
        margin: {
          left: 40,
          right: 40,
        },
        didDrawPage: () => {
          document.setFont('helvetica', 'bold');
          document.setFontSize(13);
          document.setTextColor(17, 24, 39);
          document.text(table.title, 40, cursorY + 12);
        },
      });

      cursorY = pdfDocument.lastAutoTable?.finalY ?? cursorY;
    }

    return cursorY;
  }

  private buildFileName(report: AdminDashboardReportData): string {
    const normalizedTitle = report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${normalizedTitle || 'admin-project-report'}.pdf`;
  }
}
