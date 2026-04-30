import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableLinkCell {
  dataCy?: string;
  label: string;
  routerLink: string;
}

interface TableRowNavigation {
  dataCy?: string;
  routerLink: string;
}

@Component({
  selector: 'app-table',
  imports: [RouterLink],
  templateUrl: './table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  private readonly router = inject(Router);

  @Input() columns: TableColumn[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() theme: 'default' | 'admin' = 'default';
  @Input() dataCy: string | null = null;

  isLinkCell(value: unknown): value is TableLinkCell {
    return (
      typeof value === 'object' &&
      value !== null &&
      'label' in value &&
      'routerLink' in value &&
      typeof (value as TableLinkCell).label === 'string' &&
      typeof (value as TableLinkCell).routerLink === 'string'
    );
  }

  toLinkCell(value: unknown): TableLinkCell | null {
    return this.isLinkCell(value) ? value : null;
  }

  getRowLink(row: Record<string, unknown>): string | null {
    const navigation = this.toRowNavigation(row);
    return navigation?.routerLink ?? null;
  }

  getRowDataCy(row: Record<string, unknown>): string | null {
    const navigation = this.toRowNavigation(row);
    return navigation?.dataCy ?? null;
  }

  onRowClick(row: Record<string, unknown>): void {
    const routerLink = this.getRowLink(row);
    if (!routerLink) {
      return;
    }

    void this.router.navigateByUrl(routerLink);
  }

  onRowKeydown(event: KeyboardEvent, row: Record<string, unknown>): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const routerLink = this.getRowLink(row);
    if (!routerLink) {
      return;
    }

    event.preventDefault();
    void this.router.navigateByUrl(routerLink);
  }

  private toRowNavigation(row: Record<string, unknown>): TableRowNavigation | null {
    const routerLink = row['__rowLink'];
    const dataCy = row['__rowDataCy'];

    if (typeof routerLink !== 'string' || routerLink.length === 0) {
      return null;
    }

    return {
      routerLink,
      dataCy: typeof dataCy === 'string' ? dataCy : undefined,
    };
  }
}
