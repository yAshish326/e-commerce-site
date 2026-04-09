import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UiService } from '../../../../shared/services/ui.service';

@Component({
  selector: 'app-product-form',
  standalone: false,
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {
  private static readonly MAX_INLINE_IMAGE_SIZE_BYTES = 350 * 1024;

  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly ui = inject(UiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = this.productService.categories;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(1)]],
    category: ['', Validators.required],
    description: ['', Validators.required],
  });

  productId: string | null = null;
  imageFile?: File;
  imagePreview = '';

  async ngOnInit(): Promise<void> {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (!this.productId) {
      return;
    }

    const product = await this.productService.getProductSnapshot(this.productId);
    if (!product) {
      return;
    }

    this.form.patchValue({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
    });
    this.imagePreview = product.imageUrl;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > ProductForm.MAX_INLINE_IMAGE_SIZE_BYTES) {
      this.ui.toast('Image too large. Please use an image below 350 KB.');
      input.value = '';
      this.imageFile = undefined;
      return;
    }

    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = String(reader.result ?? ''));
    reader.readAsDataURL(file);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const uid = await this.authService.getCurrentUidAsync(8000);
    if (!uid) {
      this.ui.toast('Please login again to continue');
      return;
    }

    this.ui.setLoading(true);
    try {
      const inlineImageUrl = this.imagePreview.startsWith('data:image/') ? this.imagePreview : undefined;

      if (this.productId) {
        await this.productService.updateProduct(this.productId, this.form.getRawValue(), uid, undefined, inlineImageUrl);
        this.ui.toast('Product updated');
      } else {
        await this.productService.addProduct(
          {
            ...this.form.getRawValue(),
            sellerId: uid,
          },
          undefined,
          inlineImageUrl,
        );
        this.ui.toast('Product added');
      }

      await this.router.navigate(['/seller/dashboard']);
    } catch (error: any) {
      this.ui.toast(error?.message ?? 'Save failed');
    } finally {
      this.ui.setLoading(false);
    }
  }

  async deleteProduct(): Promise<void> {
    if (!this.productId) {
      return;
    }
    await this.productService.deleteProduct(this.productId);
    this.ui.toast('Product deleted');
    await this.router.navigate(['/seller/dashboard']);
  }
}
