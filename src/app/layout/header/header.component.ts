import { ChangeDetectionStrategy, Component, HostListener, Input, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
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
  readonly accountNoteOpen = signal(false);

  protected readonly icons = {
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

  toggleAccountNote(event?: MouseEvent): void {
    event?.stopPropagation();
    this.accountNoteOpen.update((value) => !value);
  }

  closeAccountNote(event?: MouseEvent): void {
    event?.stopPropagation();
    this.accountNoteOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('[data-account-menu]')) {
      this.closeAccountNote();
    }
  }

  openCart(): void {
    this.closeMobileNav();
    this.cartState.openDrawer();
  }

  logout(): void {
    this.closeMobileNav();
    this.closeAccountNote();
    this.authService.logout();
    this.cartState.restoreCartState();
  }

  get isAdminLayout(): boolean {
    return this.layout === 'admin';
  }
}
