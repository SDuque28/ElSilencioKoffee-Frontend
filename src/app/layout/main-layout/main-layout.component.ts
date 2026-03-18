import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';

import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly route = inject(ActivatedRoute);

  readonly layout =
    (this.route.snapshot.data['layout'] as 'public' | 'admin' | undefined) ?? 'public';

  get shellClasses(): string {
    return this.layout === 'admin'
      ? 'min-h-screen bg-[#0f0f10] text-[#e5e5e5]'
      : 'min-h-screen bg-[#f7f3ef] text-[#2f2219]';
  }
}
