import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'default' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  durationMs: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _messages = signal<ToastMessage[]>([]);
  readonly messages = this._messages.asReadonly();

  show(toast: Omit<ToastMessage, 'id' | 'durationMs'> & { durationMs?: number }): void {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const durationMs = toast.durationMs ?? 3500;

    this._messages.update((current) => [...current, { ...toast, id, durationMs }]);

    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this._messages.update((current) => current.filter((message) => message.id !== id));
  }
}
