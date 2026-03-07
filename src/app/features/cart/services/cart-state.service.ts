import { computed, Injectable, signal } from '@angular/core';

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartStateService {
  private readonly _items = signal<CartItem[]>([
    { id: '1', name: 'Volcanic Roast', quantity: 1, unitPrice: 18.9 },
    { id: '2', name: 'Forest Honey Blend', quantity: 2, unitPrice: 16.2 },
  ]);

  readonly items = this._items.asReadonly();
  readonly total = computed(() =>
    this._items().reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  );

  increaseQuantity(itemId: string): void {
    this._items.update((items) =>
      items.map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item)),
    );
  }

  decreaseQuantity(itemId: string): void {
    this._items.update((items) =>
      items
        .map((item) =>
          item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  clear(): void {
    this._items.set([]);
  }
}
