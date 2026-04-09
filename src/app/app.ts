import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CartDrawerComponent } from './features/cart/components/cart-drawer.component';
import { ProductModalComponent } from './features/products/components/product-modal.component';
import { ToastComponent } from './shared/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProductModalComponent, CartDrawerComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('El Silencio Koffee');
}
