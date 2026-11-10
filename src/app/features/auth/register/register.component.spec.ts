import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { RegisterComponent } from './register.component';
import { SupabaseService } from '../../../core/services/supabase.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the register component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an invalid form due to empty required fields and unchecked terms', () => {
    expect(component['registerForm'].valid).toBe(false);
    expect(component['registerForm'].controls.fullName.valid).toBe(false);
    expect(component['registerForm'].controls.email.valid).toBe(false);
    expect(component['registerForm'].controls.password.valid).toBe(false);
    expect(component['registerForm'].controls.acceptedTerms.valid).toBe(false);
  });

  it('should toggle password visibility', () => {
    expect(component['showPassword']()).toBe(false);
    component['togglePasswordVisibility']();
    expect(component['showPassword']()).toBe(true);
    component['togglePasswordVisibility']();
    expect(component['showPassword']()).toBe(false);
  });

  it('should not submit if form is invalid and marks controls as touched', async () => {
    const supabaseService = TestBed.inject(SupabaseService);
    const signUpSpy = vi.spyOn(supabaseService, 'signUpWithEmail');

    await component['onSubmit']();
    expect(signUpSpy).not.toHaveBeenCalled();
    expect(component['isSubmitted']()).toBe(true);
    expect(component['registerForm'].controls.fullName.touched).toBe(true);
    expect(component['registerForm'].controls.email.touched).toBe(true);
    expect(component['registerForm'].controls.password.touched).toBe(true);
    expect(component['registerForm'].controls.acceptedTerms.touched).toBe(true);
  });

  it('should register user and open success modal when form is filled and submitted successfully', async () => {
    const supabaseService = TestBed.inject(SupabaseService);
    const mockUser = { id: 'mock-user-1' } as unknown as User;
    const signUpSpy = vi.spyOn(supabaseService, 'signUpWithEmail').mockResolvedValue({
      user: mockUser,
      session: null,
      error: null,
    });

    component['registerForm'].patchValue({
      fullName: 'Carlos Mendoza',
      email: 'carlos@example.com',
      password: 'password123',
      acceptedTerms: true,
    });
    expect(component['registerForm'].valid).toBe(true);

    await component['onSubmit']();
    expect(signUpSpy).toHaveBeenCalledWith(
      'carlos@example.com',
      'password123',
      'Carlos Mendoza',
      true
    );
    expect(component['isSuccessModalOpen']()).toBe(true);
    expect(component.successMessage()).toBe('Cuenta creada exitosamente.');

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('¡Bienvenido a Teacher Fabian Circles!');
    expect(compiled.textContent).toContain('Carlos Mendoza');
  });

  it('should NOT open success modal and should show error if signUpWithEmail fails', async () => {
    const supabaseService = TestBed.inject(SupabaseService);
    vi.spyOn(supabaseService, 'signUpWithEmail').mockResolvedValue({
      user: null,
      session: null,
      error: 'Ya existe una cuenta registrada con este correo electrónico. Por favor, inicia sesión.',
    });

    component['registerForm'].patchValue({
      fullName: 'Carlos Mendoza',
      email: 'carlos@example.com',
      password: 'password123',
      acceptedTerms: true,
    });

    await component['onSubmit']();
    expect(component['isSuccessModalOpen']()).toBe(false);
    expect(component.errorMessage()).toContain('Ya existe una cuenta registrada');
    expect(component.isLoading()).toBe(false);
  });

  it('should initiate Google auth when handleContinueWithGoogle is called', async () => {
    const supabaseService = TestBed.inject(SupabaseService);
    const spy = vi.spyOn(supabaseService, 'signInWithGoogle').mockResolvedValue({ error: null });

    await component['handleContinueWithGoogle']();
    expect(spy).toHaveBeenCalled();
  });

  it('should set error message when signInWithGoogle fails', async () => {
    const supabaseService = TestBed.inject(SupabaseService);
    vi.spyOn(supabaseService, 'signInWithGoogle').mockResolvedValue({
      error: 'Error al iniciar con Google.',
    });

    await component['handleContinueWithGoogle']();
    expect(component.errorMessage()).toBe('Error al iniciar con Google.');
    expect(component.isLoading()).toBe(false);
  });

  it('should manage rules modal and allow accepting terms from modal', () => {
    expect(component['isRulesModalOpen']()).toBe(false);
    component['openRulesModal']();
    expect(component['isRulesModalOpen']()).toBe(true);

    component['acceptRulesAndClose']();
    expect(component['isRulesModalOpen']()).toBe(false);
    expect(component['registerForm'].controls.acceptedTerms.value).toBe(true);
  });

  it('should close modal and navigate to /login when no session exists', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component['isSuccessModalOpen'].set(true);

    component['closeModal']();
    expect(component['isSuccessModalOpen']()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should close modal and navigate to /onboarding when active session exists', () => {
    const supabaseService = TestBed.inject(SupabaseService);
    supabaseService.currentSession.set({ access_token: 'valid' } as any);

    const navigateSpy = vi.spyOn(router, 'navigate');
    component['isSuccessModalOpen'].set(true);

    component['closeModal']();
    expect(component['isSuccessModalOpen']()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/onboarding']);
  });

  it('should initialize reactive state signals with default values', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(component.successMessage()).toBeNull();
  });

  it('should render error message in template with error color tokens when errorMessage is present', () => {
    component.errorMessage.set('Límite temporal de envíos alcanzado. Por favor, intenta de nuevo.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorEl = compiled.querySelector('.text-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl?.textContent).toContain('Límite temporal de envíos alcanzado');
  });

  it('should render success message in template with success color tokens when successMessage is present', () => {
    component.successMessage.set('Cuenta creada exitosamente.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const successEl = compiled.querySelector('.text-success');
    expect(successEl).toBeTruthy();
    expect(successEl?.textContent).toContain('Cuenta creada exitosamente.');
  });

  it('should reject whitespace-only names when submitted', async () => {
    const supabaseService = TestBed.inject(SupabaseService);
    const signUpSpy = vi.spyOn(supabaseService, 'signUpWithEmail');

    component['registerForm'].patchValue({
      fullName: '   ',
      email: 'test@example.com',
      password: 'password123',
      acceptedTerms: true,
    });

    await component['onSubmit']();
    expect(signUpSpy).not.toHaveBeenCalled();
    expect(component['isSuccessModalOpen']()).toBe(false);
  });

  it('should catch unexpected exceptions from signUpWithEmail and display friendly error message', async () => {
    const supabaseService = TestBed.inject(SupabaseService);
    vi.spyOn(supabaseService, 'signUpWithEmail').mockRejectedValue(new Error('Network failure'));

    component['registerForm'].patchValue({
      fullName: 'Elena Gomez',
      email: 'elena@example.com',
      password: 'password123',
      acceptedTerms: true,
    });

    await component['onSubmit']();
    expect(component['isSuccessModalOpen']()).toBe(false);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('No pudimos procesar tu registro. Por favor intenta de nuevo.');
  });

  it('should fallback registeredName to Miembro when no name is provided anywhere', () => {
    component['registerForm'].controls.fullName.setValue('');
    expect(component['registeredName']).toBe('Miembro');
  });

  it('should use user_metadata name for registeredName when form name is empty', () => {
    const supabaseService = TestBed.inject(SupabaseService);
    component['registerForm'].controls.fullName.setValue('');
    supabaseService.currentUser.set({
      id: 'u1',
      user_metadata: { full_name: 'Ana Torres' },
    } as unknown as User);

    expect(component['registeredName']).toBe('Ana Torres');
  });
});
