import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { SupabaseService } from '../../../core/services/supabase.service';
import {
  arrowLeftIcon,
  arrowRightIcon,
  badgeIcon,
  celebrationIcon,
  checkCircleIcon,
  checkIcon,
  eyeIcon,
  eyeOffIcon,
  lockIcon,
  mailIcon,
} from '../../../shared/icons/hugeicons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HugeiconsIconComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);

  // Form controls: acceptedTerms begins false to guarantee explicit consent per privacy standards
  protected readonly registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    acceptedTerms: [false, [Validators.requiredTrue]],
  });

  // UI state
  protected readonly showPassword = signal<boolean>(false);
  protected readonly isSubmitted = signal<boolean>(false);
  protected readonly isSuccessModalOpen = signal<boolean>(false);
  protected readonly isRulesModalOpen = signal<boolean>(false);

  // Reactive state for backend operations
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Hugeicons references
  protected readonly arrowLeftIcon = arrowLeftIcon;
  protected readonly arrowRightIcon = arrowRightIcon;
  protected readonly badgeIcon = badgeIcon;
  protected readonly checkCircleIcon = checkCircleIcon;
  protected readonly checkIcon = checkIcon;
  protected readonly celebrationIcon = celebrationIcon;
  protected readonly eyeIcon = eyeIcon;
  protected readonly eyeOffIcon = eyeOffIcon;
  protected readonly mailIcon = mailIcon;
  protected readonly lockIcon = lockIcon;

  // Pre-fill user metadata if coming back from Google OAuth or active session
  private readonly authEffect = effect(() => {
    const user = this.supabaseService.currentUser();
    const profile = this.supabaseService.userProfile();

    if (user) {
      const metaName =
        (user.user_metadata?.['full_name'] as string) ||
        (user.user_metadata?.['name'] as string) ||
        '';

      if (!this.registerForm.controls.fullName.value && metaName) {
        this.registerForm.controls.fullName.setValue(metaName);
      }
      if (!this.registerForm.controls.email.value && user.email) {
        this.registerForm.controls.email.setValue(user.email);
      }
      this.registerForm.controls.acceptedTerms.setValue(true);

      if (profile?.form_completed) {
        void this.router.navigate(['/salas']);
      } else {
        void this.router.navigate(['/onboarding']);
      }
    }
  });

  protected togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  protected async handleContinueWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const res = await this.supabaseService.signInWithGoogle('/onboarding');
    if (res.error) {
      this.isLoading.set(false);
      this.errorMessage.set(res.error);
    }
  }

  protected async onSubmit(): Promise<void> {
    this.isSubmitted.set(true);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const raw = this.registerForm.getRawValue();
    const fullName = raw.fullName.trim();
    const email = raw.email.trim();
    const password = raw.password;
    const acceptedTerms = raw.acceptedTerms;

    if (!fullName || fullName.length < 2) {
      this.registerForm.controls.fullName.setErrors({ minlength: true });
      this.registerForm.controls.fullName.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const res = await this.supabaseService.signUpWithEmail(
        email,
        password,
        fullName,
        acceptedTerms
      );
      this.isLoading.set(false);

      if (res.error) {
        this.errorMessage.set(res.error);
        return;
      }

      this.successMessage.set('Cuenta creada exitosamente.');
      this.isSuccessModalOpen.set(true);
    } catch {
      this.isLoading.set(false);
      this.errorMessage.set('No pudimos procesar tu registro. Por favor intenta de nuevo.');
    }
  }

  protected closeModal(): void {
    this.isSuccessModalOpen.set(false);
    if (this.supabaseService.currentSession()) {
      void this.router.navigate(['/onboarding']);
    } else {
      void this.router.navigate(['/login']);
    }
  }

  protected openRulesModal(): void {
    this.isRulesModalOpen.set(true);
  }

  protected closeRulesModal(): void {
    this.isRulesModalOpen.set(false);
  }

  protected acceptRulesAndClose(): void {
    this.registerForm.controls.acceptedTerms.setValue(true);
    this.isRulesModalOpen.set(false);
  }

  protected get registeredName(): string {
    const formName = this.registerForm.controls.fullName.value.trim();
    const profileName = this.supabaseService.userProfile()?.full_name?.trim();
    const metaName = (
      (this.supabaseService.currentUser()?.user_metadata?.['full_name'] as string) ||
      (this.supabaseService.currentUser()?.user_metadata?.['name'] as string) ||
      ''
    ).trim();

    return formName || profileName || metaName || 'Miembro';
  }
}
