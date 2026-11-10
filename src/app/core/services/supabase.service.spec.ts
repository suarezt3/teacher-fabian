import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupabaseService],
    });
    service = TestBed.inject(SupabaseService);
  });

  afterEach(() => {
    try {
      localStorage.removeItem('tf_pending_speaking_profile');
    } catch {
      // ignore
    }
  });

  it('should be created and initialize default signals', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
    expect(service.currentSession()).toBeNull();
    expect(service.userProfile()).toBeNull();
    expect(service.pendingUser()).toBeNull();
    expect(service.supabase).toBeTruthy();
  });

  it('should resolve waitForAuthInit and report isAuthInitialized', async () => {
    await service.waitForAuthInit();
    expect(service.isAuthInitialized()).toBe(true);
  });

  it('should return error when updating profile without active or pending user', async () => {
    const result = await service.updateSpeakingProfile('B2', ['Tecnología & IA', 'Cine & Narrativa']);
    expect(result.profile).toBeNull();
    expect(result.error).toContain('No se encontró un usuario activo');
  });

  it('should sanitize technical error messages into clear user-friendly Spanish without backend names', () => {
    const sanitize = service['sanitizeErrorMessage'].bind(service);

    const rateLimitMsg = sanitize('rate limit exceeded', 'over_email_send_rate_limit');
    expect(rateLimitMsg).toContain('Límite temporal de envíos alcanzado');
    expect(rateLimitMsg.toLowerCase()).not.toContain('supabase');
    expect(rateLimitMsg.toLowerCase()).not.toContain('gotrue');

    const duplicateMsg = sanitize('User already registered', 'user_already_exists');
    expect(duplicateMsg).toContain('Ya existe una cuenta registrada');

    const credsMsg = sanitize('Invalid login credentials', 'invalid_credentials');
    expect(credsMsg).toContain('Correo o contraseña incorrectos');

    const rlsMsg = sanitize('new row violates row level security policy for table "profiles"');
    expect(rlsMsg).toContain('Tu sesión ha expirado o no tienes permisos');
    expect(rlsMsg.toLowerCase()).not.toContain('row level security');
    expect(rlsMsg.toLowerCase()).not.toContain('profiles');

    const fallbackMsg = sanitize('unknown internal pg error');
    expect(fallbackMsg).toContain('No pudimos procesar tu solicitud');
  });

  it('should detect duplicate user when Supabase returns empty identities array', async () => {
    vi.spyOn(service.supabase.auth, 'signUp').mockResolvedValue({
      data: {
        user: {
          id: 'existing-id',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          identities: [],
        } as any,
        session: null,
      },
      error: null,
    });

    const result = await service.signUpWithEmail(
      'existing@example.com',
      'password123',
      'Juan Pérez',
      true
    );

    expect(result.user).toBeNull();
    expect(result.error).toContain('Ya existe una cuenta registrada con este correo electrónico');
  });

  it('should sign in with email and password successfully', async () => {
    const mockUser = {
      id: 'mock-user-123',
      email: 'member@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    const mockSession = {
      access_token: 'fake-token',
      user: mockUser,
    };

    vi.spyOn(service.supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: { user: mockUser as any, session: mockSession as any },
      error: null,
    });
    vi.spyOn(service as any, 'loadProfile').mockResolvedValue({
      id: 'mock-user-123',
      full_name: 'Member Test',
      email: 'member@example.com',
      form_completed: true,
    });

    const res = await service.signInWithEmail('member@example.com', 'validPassword123');

    expect(res.error).toBeNull();
    expect(res.user?.id).toBe('mock-user-123');
    expect(service.currentUser()?.id).toBe('mock-user-123');
    expect(service.currentSession()).toBeTruthy();
  });

  it('should return sanitized error when signInWithEmail fails', async () => {
    vi.spyOn(service.supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', name: 'AuthError', status: 400 } as any,
    });

    const res = await service.signInWithEmail('wrong@example.com', 'badPassword');

    expect(res.user).toBeNull();
    expect(res.error).toBe('Correo o contraseña incorrectos. Revisa tus datos e intenta de nuevo.');
  });

  it('should pass custom redirect path in signInWithGoogle', async () => {
    const oAuthSpy = vi.spyOn(service.supabase.auth, 'signInWithOAuth').mockResolvedValue({
      data: { provider: 'google', url: 'https://example.com/oauth' },
      error: null,
    });

    const res = await service.signInWithGoogle('/salas');

    expect(res.error).toBeNull();
    expect(oAuthSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/salas'),
        }),
      })
    );
  });

  it('should support profile update for pending user with preferredSchedule and form_completed: true', async () => {
    service.pendingUser.set({
      id: 'mock-user-uuid-1234',
      email: 'santiago@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'Santiago Test' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    });

    const result = await service.updateSpeakingProfile(
      'C1',
      ['Debate & Noticias', 'Viajes & Culturas'],
      'Martes y Jueves 19:00'
    );

    expect(result.error).toBeNull();
    expect(result.profile).toBeTruthy();
    expect(result.profile?.english_level).toBe('C1');
    expect(result.profile?.interest_topics).toEqual(['Debate & Noticias', 'Viajes & Culturas']);
    expect(result.profile?.preferred_schedule).toBe('Martes y Jueves 19:00');
    expect(result.profile?.form_completed).toBe(true);

    const stored = localStorage.getItem('tf_pending_speaking_profile');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.englishLevel).toBe('C1');
    expect(parsed.preferredSchedule).toBe('Martes y Jueves 19:00');
  });

  it('should clear signals and pending profile upon signOut', async () => {
    localStorage.setItem(
      'tf_pending_speaking_profile',
      JSON.stringify({ userId: 'mock-user-uuid-1234', englishLevel: 'B2', topics: [] })
    );

    service.currentUser.set({
      id: 'mock-user-uuid-1234',
      email: 'santiago@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    });
    service.userProfile.set({
      id: 'mock-user-uuid-1234',
      full_name: 'Santiago',
      email: 'santiago@example.com',
      english_level: 'B2',
      interest_topics: [],
      accepted_respect_code: true,
      avatar_url: null,
      preferred_schedule: null,
      form_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await service.signOut();

    expect(service.currentUser()).toBeNull();
    expect(service.currentSession()).toBeNull();
    expect(service.userProfile()).toBeNull();
    expect(service.pendingUser()).toBeNull();
    expect(localStorage.getItem('tf_pending_speaking_profile')).toBeNull();
  });

  it('should return error when saveOnboardingProfile is called without user', async () => {
    const payload = {
      whatsapp_number: '+573001234567',
      age: 28,
      country_city: 'Colombia, Bogotá',
      gender: 'Femenino',
      education_level: 'Universitario en curso',
      occupation: 'Empleado(a)',
      profession_area: 'Ingeniería',
      previous_study_type: 'Sí, en colegio / universidad.',
      study_duration: 'De 1 a 3 años',
      international_exam: 'No he presentado ninguno',
      english_level: 'B1' as const,
      speaking_comfort: 'Moderadamente cómodo(a)',
      previous_club_experience: 'Nunca he participado en un club',
      learning_goals: ['Mejorar fluidez y perder el miedo a hablar'],
    };

    const result = await service.saveOnboardingProfile(payload);
    expect(result.profile).toBeNull();
    expect(result.error).toContain('No se encontró un usuario activo');
  });

  it('should saveOnboardingProfile with active session and update userProfile', async () => {
    service.currentUser.set({
      id: 'usr-active-77',
      email: 'member77@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'Camila Torres' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    });
    service.currentSession.set({
      access_token: 'fake-token',
      refresh_token: 'fake-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: service.currentUser()!,
    });

    const mockSavedProfile = {
      id: 'usr-active-77',
      full_name: 'Camila Torres',
      email: 'member77@example.com',
      whatsapp_number: '+573111234567',
      age: 26,
      country_city: 'Colombia, Medellín',
      gender: 'Femenino',
      education_level: 'Profesional graduado',
      occupation: 'Independiente / Freelance',
      profession_area: 'Diseño UX',
      previous_study_type: 'Sí, de forma autodidacta (apps, videos, lectura).',
      study_duration: 'De 1 a 3 años',
      international_exam: 'No he presentado ninguno',
      english_level: 'B2' as const,
      speaking_comfort: 'Moderadamente cómodo(a)',
      previous_club_experience: 'He participado en pocos clubes',
      learning_goals: ['Mejorar fluidez y perder el miedo a hablar', 'Networking y conocer personas internacionales'],
      data_processing_authorized: true,
      data_authorized_at: new Date().toISOString(),
      form_completed: true,
      interest_topics: [],
      accepted_respect_code: true,
      avatar_url: null,
      preferred_schedule: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(service.supabase, 'from').mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () => Promise.resolve({ data: mockSavedProfile, error: null }),
          }),
        }),
      }),
    } as any);

    const result = await service.saveOnboardingProfile({
      whatsapp_number: '+573111234567',
      age: 26,
      country_city: 'Colombia, Medellín',
      gender: 'Femenino',
      education_level: 'Profesional graduado',
      occupation: 'Independiente / Freelance',
      profession_area: 'Diseño UX',
      previous_study_type: 'Sí, de forma autodidacta (apps, videos, lectura).',
      study_duration: 'De 1 a 3 años',
      international_exam: 'No he presentado ninguno',
      english_level: 'B2',
      speaking_comfort: 'Moderadamente cómodo(a)',
      previous_club_experience: 'He participado en pocos clubes',
      learning_goals: ['Mejorar fluidez y perder el miedo a hablar', 'Networking y conocer personas internacionales'],
    });

    expect(result.error).toBeNull();
    expect(result.profile?.form_completed).toBe(true);
    expect(result.profile?.data_processing_authorized).toBe(true);
    expect(service.userProfile()?.form_completed).toBe(true);
  });
});
