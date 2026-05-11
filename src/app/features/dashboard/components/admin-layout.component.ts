import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminTopbarComponent } from './admin-topbar.component';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, AdminSidebarComponent, AdminTopbarComponent],
  styleUrl: './admin-layout.component.css',
  template: `
    <div class="admin-layout min-h-screen bg-[#0f0f10] text-zinc-100">
      <app-admin-sidebar />
      <div class="admin-layout__scroll h-screen overflow-y-auto lg:pl-64">
        <app-admin-topbar />
        <main class="min-h-[calc(100vh-4rem)] px-4 py-6 lg:px-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {}
