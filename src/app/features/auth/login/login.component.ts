import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { SupabaseService } from '../../../core/services/supabase.service';
import {
  arrowLeftIcon,
  arrowRightIcon,
  checkCircleIcon,
  checkIcon,
  eyeIcon,
  eyeOffIcon,
  lockIcon,
  mailIcon,
} from '../../../shared/icons/hugeicons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HugeiconsIconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);

  // Reactive form
  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // UI state signals
  protected readonly showPassword = signal<boolean>(false);
  protected readonly isSubmitted = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Hugeicons
  protected readonly arrowLeftIcon = arrowLeftIcon;
  protected readonly arrowRightIcon = arrowRightIcon;
  protected readonly checkCircleIcon = checkCircleIcon;
  protected readonly checkIcon = checkIcon;
  protected readonly eyeIcon = eyeIcon;
  protected readonly eyeOffIcon = eyeOffIcon;
  protected readonly lockIcon = lockIcon;
  protected readonly mailIcon = mailIcon;

  protected togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  protected async handleContinueWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const res = await this.supabaseService.signInWithGoogle('/salas');
    if (res.error) {
      this.isLoading.set(false);
      this.errorMessage.set(res.error);
    }
  }

  protected async onSubmit(): Promise<void> {
    this.isSubmitted.set(true);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const res = await this.supabaseService.signInWithEmail(email, password);
      this.isLoading.set(false);

      if (res.error) {
        this.errorMessage.set(res.error);
        return;
      }

      this.successMessage.set('Sesión iniciada correctamente. Redirigiendo...');

      const profile = this.supabaseService.userProfile();
      if (profile?.form_completed) {
        void this.router.navigate(['/salas']);
      } else {
        void this.router.navigate(['/onboarding']);
      }
    } catch {
      this.isLoading.set(false);
      this.errorMessage.set('No pudimos procesar tu solicitud. Por favor intenta de nuevo.');
    }
  }
}
