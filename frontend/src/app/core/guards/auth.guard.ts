import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  let uid = await authService.getCurrentUidAsync(10000);

  // If there's a persisted token but auth state hasn't hydrated yet, try validating the stored session.
  if (!uid && localStorage.getItem('auth.token') && localStorage.getItem('auth.uid')) {
    try {
      const valid = await authService.validateStoredSession();
      if (valid) {
        uid = authService.getCurrentUid();
      }
    } catch {
      // ignore and fall through to redirect
    }
  }

  if (!uid) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: router.url },
    });
  }

  return true;
};