import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
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
import { CartStateService } from '../../features/cart/services/cart-state.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Input() layout: 'public' | 'admin' = 'public';

  readonly authService = inject(AuthService);
  readonly cartState = inject(CartStateService);
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

  openCart(): void {
    this.closeMobileNav();
    this.cartState.openDrawer();
  }

  logout(): void {
    this.closeMobileNav();
    this.authService.logout();
  }

  get isAdminLayout(): boolean {
    return this.layout === 'admin';
  }
}
