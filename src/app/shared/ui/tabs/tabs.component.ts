import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  type OnChanges,
} from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent implements OnChanges {
  @Input() tabs: TabItem[] = [];
  @Input() activeTabId = '';
  @Output() activeTabIdChange = new EventEmitter<string>();

  readonly selectedId = signal('');

  ngOnChanges(): void {
    const fallback = this.tabs[0]?.id ?? '';
    this.selectedId.set(this.activeTabId || fallback);
  }

  selectTab(tabId: string): void {
    this.selectedId.set(tabId);
    this.activeTabIdChange.emit(tabId);
  }
}
