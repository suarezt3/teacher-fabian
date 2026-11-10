import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Database, OnboardingPayload, Profile, ProfileUpdate } from '../models/database.types';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export interface ProfileResponse {
  profile: Profile | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly client: SupabaseClient<Database>;

  // Reactive state signals
  readonly currentUser = signal<User | null>(null);
  readonly currentSession = signal<Session | null>(null);
  readonly userProfile = signal<Profile | null>(null);
  readonly pendingUser = signal<User | null>(null);
  readonly isAuthInitialized = signal<boolean>(false);

  private authInitResolver?: () => void;
  private readonly authInitPromise: Promise<void>;

  constructor() {
    this.authInitPromise = new Promise<void>((resolve) => {
      this.authInitResolver = resolve;
    });

    this.client = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: this.isBrowser,
          autoRefreshToken: this.isBrowser,
          detectSessionInUrl: this.isBrowser,
        },
      }
    );

    if (this.isBrowser) {
      void this.initializeAuth();
    } else {
      this.isAuthInitialized.set(true);
      this.authInitResolver?.();
    }
  }

  get supabase(): SupabaseClient<Database> {
    return this.client;
  }

  async waitForAuthInit(): Promise<void> {
    if (this.isAuthInitialized()) {
      return;
    }
    await this.authInitPromise;
  }

  private async initializeAuth(): Promise<void> {
    try {
      const {
        data: { session },
      } = await this.client.auth.getSession();

      if (session) {
        this.currentSession.set(session);
        this.currentUser.set(session.user);
        await this.syncPendingProfile(session.user.id);
        await this.loadProfile(session.user.id);
      }

      this.client.auth.onAuthStateChange(async (_event, session) => {
        this.currentSession.set(session);
        this.currentUser.set(session?.user ?? null);

        if (session?.user) {
          await this.syncPendingProfile(session.user.id);
          await this.loadProfile(session.user.id);
        } else {
          this.userProfile.set(null);
        }
      });
    } catch {
      // Safe fallback on initial auth resolution failure
    } finally {
      this.isAuthInitialized.set(true);
      this.authInitResolver?.();
    }
  }

  private async syncPendingProfile(userId: string): Promise<void> {
    if (!this.isBrowser) {
      return;
    }
    try {
      const raw = localStorage.getItem('tf_pending_speaking_profile');
      if (!raw) {
        return;
      }
      const pending = JSON.parse(raw) as {
        userId?: string;
        englishLevel: 'B1' | 'B2' | 'C1';
        topics: string[];
        preferredSchedule?: string | null;
      };
      if (!pending.userId || pending.userId === userId) {
        await this.client
          .from('profiles')
          .update({
            english_level: pending.englishLevel,
            interest_topics: pending.topics,
            preferred_schedule: pending.preferredSchedule ?? null,
            form_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        localStorage.removeItem('tf_pending_speaking_profile');
      }
    } catch {
      // Safe fallback
    }
  }

  private async loadProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        const profile = data as Profile;
        this.userProfile.set(profile);
        return profile;
      }
      return null;
    } catch {
      return null;
    }
  }

  async refreshProfile(): Promise<Profile | null> {
    const user = this.currentUser();
    if (!user) {
      this.userProfile.set(null);
      return null;
    }
    return this.loadProfile(user.id);
  }

  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string,
    acceptedTerms: boolean
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            accepted_respect_code: acceptedTerms,
          },
        },
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: this.sanitizeErrorMessage(error.message, error.code),
        };
      }

      // Supabase Auth returns a user with empty identities when email already exists
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        return {
          user: null,
          session: null,
          error:
            'Ya existe una cuenta registrada con este correo electrónico. Por favor, inicia sesión.',
        };
      }

      if (data.user) {
        this.pendingUser.set(data.user);
        if (data.session) {
          this.currentUser.set(data.user);
          this.currentSession.set(data.session);
          await this.loadProfile(data.user.id);
        }
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar tu cuenta.';
      return {
        user: null,
        session: null,
        error: this.sanitizeErrorMessage(msg),
      };
    }
  }

  async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: this.sanitizeErrorMessage(error.message, error.code),
        };
      }

      if (data.user && data.session) {
        this.currentUser.set(data.user);
        this.currentSession.set(data.session);
        await this.syncPendingProfile(data.user.id);
        await this.loadProfile(data.user.id);
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión.';
      return {
        user: null,
        session: null,
        error: this.sanitizeErrorMessage(msg),
      };
    }
  }

  async signInWithGoogle(redirectPath = '/salas'): Promise<{ error: string | null }> {
    if (!this.isBrowser) {
      return { error: 'Acceso no disponible en este entorno.' };
    }

    try {
      const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
      const redirectTo = `${window.location.origin}${path}`;
      const { error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return {
          error: this.sanitizeErrorMessage(error.message, error.code),
        };
      }

      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar con Google.';
      return {
        error: this.sanitizeErrorMessage(msg),
      };
    }
  }

  async updateSpeakingProfile(
    englishLevel: 'B1' | 'B2' | 'C1',
    topics: string[],
    preferredSchedule: string | null = null
  ): Promise<ProfileResponse> {
    try {
      const user = this.currentUser() ?? this.pendingUser();

      if (!user) {
        return {
          profile: null,
          error: 'No se encontró un usuario activo. Por favor completa el primer paso.',
        };
      }

      // If user is authenticated with active session, execute update with RLS
      if (this.currentSession()) {
        const { data, error } = await this.client
          .from('profiles')
          .update({
            english_level: englishLevel,
            interest_topics: topics,
            preferred_schedule: preferredSchedule,
            form_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .maybeSingle();

        if (error) {
          return {
            profile: null,
            error: this.sanitizeErrorMessage(error.message),
          };
        }

        const profile = data as Profile;
        this.userProfile.set(profile);
        return { profile, error: null };
      }

      // If email confirmation is required, store pending profile in localStorage
      // so it will be automatically synchronized on confirmation or subsequent login
      if (this.isBrowser) {
        try {
          localStorage.setItem(
            'tf_pending_speaking_profile',
            JSON.stringify({
              userId: user.id,
              email: user.email,
              englishLevel,
              topics,
              preferredSchedule,
              timestamp: Date.now(),
            })
          );
        } catch {
          // ignore localStorage storage errors
        }
      }

      // Create optimistic profile
      const optimisticProfile: Profile = {
        id: user.id,
        full_name:
          (user.user_metadata?.['full_name'] as string) ||
          this.userProfile()?.full_name ||
          'Miembro',
        email: user.email || '',
        english_level: englishLevel,
        interest_topics: topics,
        accepted_respect_code: true,
        avatar_url:
          (user.user_metadata?.['avatar_url'] as string) ||
          this.userProfile()?.avatar_url ||
          null,
        preferred_schedule: preferredSchedule,
        form_completed: true,
        whatsapp_number: this.userProfile()?.whatsapp_number ?? null,
        age: this.userProfile()?.age ?? null,
        country_city: this.userProfile()?.country_city ?? null,
        gender: this.userProfile()?.gender ?? null,
        education_level: this.userProfile()?.education_level ?? null,
        occupation: this.userProfile()?.occupation ?? null,
        profession_area: this.userProfile()?.profession_area ?? null,
        previous_study_type: this.userProfile()?.previous_study_type ?? null,
        study_duration: this.userProfile()?.study_duration ?? null,
        international_exam: this.userProfile()?.international_exam ?? null,
        learning_goals: this.userProfile()?.learning_goals ?? [],
        speaking_comfort: this.userProfile()?.speaking_comfort ?? null,
        previous_club_experience: this.userProfile()?.previous_club_experience ?? null,
        data_processing_authorized: this.userProfile()?.data_processing_authorized ?? false,
        data_authorized_at: this.userProfile()?.data_authorized_at ?? null,
        created_at: this.userProfile()?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.userProfile.set(optimisticProfile);
      return { profile: optimisticProfile, error: null };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al actualizar tu perfil de conversación.';
      return {
        profile: null,
        error: this.sanitizeErrorMessage(msg),
      };
    }
  }

  async saveOnboardingProfile(payload: OnboardingPayload): Promise<ProfileResponse> {
    try {
      const user = this.currentUser() ?? this.pendingUser();
      if (!user) {
        return {
          profile: null,
          error: 'No se encontró un usuario activo. Por favor inicia sesión.',
        };
      }

      const authorizedAt = new Date().toISOString();
      const updateData: ProfileUpdate = {
        whatsapp_number: payload.whatsapp_number,
        age: payload.age,
        country_city: payload.country_city,
        gender: payload.gender,
        education_level: payload.education_level,
        occupation: payload.occupation,
        profession_area: payload.profession_area || null,
        previous_study_type: payload.previous_study_type,
        study_duration: payload.study_duration,
        international_exam: payload.international_exam,
        english_level: payload.english_level,
        speaking_comfort: payload.speaking_comfort,
        previous_club_experience: payload.previous_club_experience,
        learning_goals: payload.learning_goals,
        data_processing_authorized: true,
        data_authorized_at: authorizedAt,
        form_completed: true,
        updated_at: authorizedAt,
      };

      if (this.currentSession()) {
        const { data, error } = await this.client
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)
          .select()
          .maybeSingle();

        if (error) {
          return {
            profile: null,
            error: this.sanitizeErrorMessage(error.message),
          };
        }

        const profile = data as Profile;
        this.userProfile.set(profile);
        return { profile, error: null };
      }

      // Optimistic fallback for pending / unconfirmed users
      const current = this.userProfile();
      const optimisticProfile: Profile = {
        id: user.id,
        email: user.email || '',
        full_name:
          (user.user_metadata?.['full_name'] as string) ||
          (user.user_metadata?.['name'] as string) ||
          current?.full_name ||
          'Miembro',
        avatar_url: current?.avatar_url ?? null,
        interest_topics: current?.interest_topics ?? [],
        accepted_respect_code: current?.accepted_respect_code ?? true,
        preferred_schedule: current?.preferred_schedule ?? null,
        created_at: current?.created_at || authorizedAt,
        ...updateData,
      } as Profile;

      this.userProfile.set(optimisticProfile);
      return { profile: optimisticProfile, error: null };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al guardar el diagnóstico.';
      return {
        profile: null,
        error: this.sanitizeErrorMessage(msg),
      };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        return { error: this.sanitizeErrorMessage(error.message) };
      }
      this.currentUser.set(null);
      this.currentSession.set(null);
      this.userProfile.set(null);
      this.pendingUser.set(null);
      if (this.isBrowser) {
        try {
          localStorage.removeItem('tf_pending_speaking_profile');
        } catch {
          // ignore
        }
      }
      return { error: null };
    } catch {
      return { error: 'No se pudo cerrar la sesión.' };
    }
  }

  private sanitizeErrorMessage(rawMessage: string, code?: string): string {
    const lower = rawMessage.toLowerCase();

    if (code === 'over_email_send_rate_limit' || lower.includes('rate limit')) {
      return 'Límite temporal de envíos alcanzado. Por favor, intenta de nuevo en unos minutos.';
    }
    if (
      code === 'user_already_exists' ||
      lower.includes('already registered') ||
      lower.includes('already exists')
    ) {
      return 'Ya existe una cuenta registrada con este correo electrónico. Por favor, inicia sesión.';
    }
    if (code === 'invalid_credentials' || lower.includes('invalid login credentials')) {
      return 'Correo o contraseña incorrectos. Revisa tus datos e intenta de nuevo.';
    }
    if (lower.includes('password') && lower.includes('characters')) {
      return 'La contraseña debe contener al menos 8 caracteres.';
    }
    if (lower.includes('email') && (lower.includes('invalid') || lower.includes('format'))) {
      return 'Por favor ingresa un formato de correo electrónico válido.';
    }
    if (lower.includes('network') || lower.includes('fetch')) {
      return 'No hay conexión con el servidor. Revisa tu red e intenta nuevamente.';
    }
    if (lower.includes('row level security') || lower.includes('permission denied')) {
      return 'Tu sesión ha expirado o no tienes permisos para esta acción.';
    }

    return 'No pudimos procesar tu solicitud. Por favor intenta de nuevo.';
  }
}
