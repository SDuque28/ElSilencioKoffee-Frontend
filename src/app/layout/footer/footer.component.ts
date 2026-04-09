import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  @Input() layout: 'public' | 'admin' = 'public';

  readonly year = new Date().getFullYear();
  readonly navigationLinks = ['Home', 'Products', 'Cart', 'Orders'];
  readonly socialLinks = ['Instagram', 'Pinterest', 'X'];

  get isAdminLayout(): boolean {
    return this.layout === 'admin';
  }
}
