import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserProfile } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { UiService } from '../../../../shared/services/ui.service';

@Component({
  selector: 'app-customer-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class CustomerProfilePageComponent implements OnInit, OnDestroy {
  private static readonly INLINE_PHOTO_MAX_BYTES = 350 * 1024;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly ui = inject(UiService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly subscriptions = new Subscription();
  private currentUid: string | null = null;

  selectedFileName = '';
  previewPhotoUrl = '';

  readonly form = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.minLength(10), Validators.maxLength(15)]],
    photoURL: [''],
  });

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.profile$.subscribe((profile) => {
        if (!profile) return;

        this.currentUid = profile.uid;
        this.form.patchValue({
          email: profile.email,
          displayName: profile.displayName ?? '',
          phone: profile.phone ?? '',
          photoURL: profile.photoURL ?? '',
        });
        this.previewPhotoUrl = profile.photoURL ?? '';
        this.cdr.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async resolveUid(): Promise<string | null> {
    if (this.currentUid) return this.currentUid;
    const uid = await this.authService.getCurrentUidAsync(8000);
    this.currentUid = uid;
    return uid;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.ui.toast('Please select an image file');
      return;
    }

    // ✅ Check size limit — 350KB max for base64
    if (file.size > CustomerProfilePageComponent.INLINE_PHOTO_MAX_BYTES) {
      this.ui.toast('Image must be smaller than 350 KB');
      input.value = '';
      return;
    }

    const uid = await this.resolveUid();
    if (!uid) {
      this.ui.toast('Please login again');
      return;
    }

    this.selectedFileName = file.name;
    this.ui.setLoading(true);

    try {
      // ✅ Simplified — uploadProfilePhoto now just does base64, no Firebase Storage
      const photoURL = await this.authService.uploadProfilePhoto(uid, file);
      await this.authService.updateProfile(uid, { photoURL });
      this.form.patchValue({ photoURL });
      this.previewPhotoUrl = photoURL;
      this.cdr.markForCheck();
      this.ui.toast('Profile photo updated ✓');
    } catch (error: unknown) {
      const message = (error as { message?: string } | null)?.message;
      if (message === 'invalid-image-type') {
        this.ui.toast('Please upload a valid image file');
      } else if (message === 'image-too-large') {
        this.ui.toast('Image must be smaller than 350 KB');
      } else {
        this.ui.toast('Photo upload failed. Please try again');
      }
    } finally {
      this.ui.setLoading(false);
    }
  }

  async saveProfile(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const uid = await this.resolveUid();
    if (!uid) {
      this.ui.toast('Please login again');
      return;
    }

    const values = this.form.getRawValue();
    const updates: Partial<UserProfile> = {
      displayName: values.displayName.trim(),
      phone: values.phone.trim(),
      photoURL: values.photoURL.trim(),
    };

    this.ui.setLoading(true);
    try {
      await this.authService.updateProfile(uid, updates);
      this.ui.toast('Profile updated ✓');
      this.cdr.markForCheck();
    } catch {
      this.ui.toast('Could not update profile');
    } finally {
      this.ui.setLoading(false);
    }
  }
}