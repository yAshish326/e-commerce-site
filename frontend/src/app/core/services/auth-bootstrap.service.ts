import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthBootstrapService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Run at application startup to ensure any persisted session is valid.
   * If no valid session exists, clear storage and navigate to the login page.
   */
  async init(): Promise<void> {
    const valid = await this.auth.validateStoredSession();
    if (!valid) {
      // ensure we end up on the login page when there is no valid session
      try {
        await this.router.navigate(['/auth/login'], { replaceUrl: true });
      } catch {
        // ignore navigation failures during bootstrap
      }
    }
  }
}
