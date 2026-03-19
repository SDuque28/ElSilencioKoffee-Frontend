export interface CartItem {
  itemId: string;
  productId: string;
  name: string;
  category: string;
  image: string;
  selectionLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}
