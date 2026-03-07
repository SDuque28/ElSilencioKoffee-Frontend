import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BarChart3, Factory, Leaf, LucideAngularModule, UsersRound } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly icons = {
    sales: BarChart3,
    users: UsersRound,
    environment: Leaf,
    production: Factory,
  };
}
