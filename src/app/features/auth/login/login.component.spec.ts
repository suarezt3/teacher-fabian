import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../../../core/models/database.types';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let supabaseService: SupabaseService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        SupabaseService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    supabaseService = TestBed.inject(SupabaseService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create and initialize default state', () => {
    expect(component).toBeTruthy();
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(component.successMessage()).toBeNull();
    expect(component['showPassword']()).toBe(false);
    expect(component['isSubmitted']()).toBe(false);
  });

  it('should toggle password visibility', () => {
    expect(component['showPassword']()).toBe(false);
    component['togglePasswordVisibility']();
    expect(component['showPassword']()).toBe(true);
    component['togglePasswordVisibility']();
    expect(component['showPassword']()).toBe(false);
  });

  it('should not submit when form is invalid', async () => {
    const signInSpy = vi.spyOn(supabaseService, 'signInWithEmail');
    await component['onSubmit']();

    expect(component['isSubmitted']()).toBe(true);
    expect(signInSpy).not.toHaveBeenCalled();
    expect(component['loginForm'].invalid).toBe(true);
  });

  it('should handle Google authentication and set error if it fails', async () => {
    vi.spyOn(supabaseService, 'signInWithGoogle').mockResolvedValue({
      error: 'Error al iniciar con Google.',
    });

    await component['handleContinueWithGoogle']();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('Error al iniciar con Google.');
  });

  it('should display error message when signInWithEmail returns an error', async () => {
    vi.spyOn(supabaseService, 'signInWithEmail').mockResolvedValue({
      user: null,
      session: null,
      error: 'Correo o contraseña incorrectos.',
    });

    component['loginForm'].setValue({
      email: 'usuario@ejemplo.com',
      password: 'password123',
    });

    await component['onSubmit']();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('Correo o contraseña incorrectos.');
  });

  it('should navigate to /salas when user has completed onboarding profile', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    vi.spyOn(supabaseService, 'signInWithEmail').mockResolvedValue({
      user: { id: 'u-123' } as User,
      session: { access_token: 'token' } as Session,
      error: null,
    });

    supabaseService.userProfile.set({
      id: 'u-123',
      full_name: 'Santiago Test',
      email: 'santiago@example.com',
      form_completed: true,
      english_level: 'B2',
      interest_topics: [],
      accepted_respect_code: true,
      avatar_url: null,
      preferred_schedule: null,
      created_at: '',
      updated_at: '',
    } as Profile);

    component['loginForm'].setValue({
      email: 'santiago@example.com',
      password: 'password123',
    });

    await component['onSubmit']();

    expect(component.errorMessage()).toBeNull();
    expect(component.successMessage()).toContain('Sesión iniciada correctamente');
    expect(navigateSpy).toHaveBeenCalledWith(['/salas']);
  });

  it('should navigate to /onboarding when user profile is not completed', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    vi.spyOn(supabaseService, 'signInWithEmail').mockResolvedValue({
      user: { id: 'u-123' } as User,
      session: { access_token: 'token' } as Session,
      error: null,
    });

    supabaseService.userProfile.set({
      id: 'u-123',
      full_name: 'Santiago Test',
      email: 'santiago@example.com',
      form_completed: false,
      english_level: null,
      interest_topics: [],
      accepted_respect_code: true,
      avatar_url: null,
      preferred_schedule: null,
      created_at: '',
      updated_at: '',
    } as Profile);

    component['loginForm'].setValue({
      email: 'santiago@example.com',
      password: 'password123',
    });

    await component['onSubmit']();

    expect(navigateSpy).toHaveBeenCalledWith(['/onboarding']);
  });

  it('should handle unexpected exception during onSubmit gracefully', async () => {
    vi.spyOn(supabaseService, 'signInWithEmail').mockRejectedValue(new Error('Network crash'));

    component['loginForm'].setValue({
      email: 'santiago@example.com',
      password: 'password123',
    });

    await component['onSubmit']();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('No pudimos procesar tu solicitud. Por favor intenta de nuevo.');
  });
});
