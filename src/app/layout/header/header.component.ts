import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  Coffee,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  Menu,
  ShoppingCart,
  UserRound,
} from 'lucide-angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  readonly mobileNavOpen = signal(false);

  protected readonly icons = {
    coffee: Coffee,
    cart: ShoppingCart,
    dashboard: LayoutDashboard,
    menu: Menu,
    user: UserRound,
    logout: LogOut,
  };

  toggleMobileNav(): void {
    this.mobileNavOpen.update((value) => !value);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  logout(): void {
    this.closeMobileNav();
    this.authService.logout();
  }
}
