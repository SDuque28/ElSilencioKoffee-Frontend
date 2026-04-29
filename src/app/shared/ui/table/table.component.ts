import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableLinkCell {
  dataCy?: string;
  label: string;
  routerLink: string;
}

@Component({
  selector: 'app-table',
  imports: [RouterLink],
  templateUrl: './table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
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
}
