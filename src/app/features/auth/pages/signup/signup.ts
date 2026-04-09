import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/models/app.models';
import { UiService } from '../../../../shared/services/ui.service';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);

  readonly roles: UserRole[] = ['customer', 'partner'];

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['customer' as UserRole, Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ui.setLoading(true);
    try {
      const { email, password, role } = this.form.getRawValue();
      await this.authService.signup(email, password, role);
      this.ui.toast('Account created');
      await this.router.navigate(['/auth/login']);
    } catch (error: any) {
      this.ui.toast(error?.message ?? 'Signup failed');
    } finally {
      this.ui.setLoading(false);
    }
  }
}
