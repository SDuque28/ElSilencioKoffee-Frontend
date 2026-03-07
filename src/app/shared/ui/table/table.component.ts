import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() rows: Record<string, unknown>[] = [];
}
