import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { guestGuard, onboardingGuard, roomsAccessGuard } from './auth.guard';
import { SupabaseService } from '../services/supabase.service';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../models/database.types';

describe('Auth Guards', () => {
  let supabaseService: SupabaseService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        SupabaseService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    supabaseService = TestBed.inject(SupabaseService);
    router = TestBed.inject(Router);
    supabaseService.isAuthInitialized.set(true);
  });

  describe('guestGuard', () => {
    it('should allow access if user has no active session', async () => {
      supabaseService.currentSession.set(null);

      const result = await TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to /onboarding if user is authenticated but profile is incomplete', async () => {
      supabaseService.currentSession.set({ user: { id: 'u1' } } as Session);
      supabaseService.userProfile.set({ id: 'u1', form_completed: false } as Profile);

      const result = await TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/onboarding');
    });

    it('should redirect to /salas if user is authenticated and profile is complete', async () => {
      supabaseService.currentSession.set({ user: { id: 'u1' } } as Session);
      supabaseService.userProfile.set({ id: 'u1', form_completed: true } as Profile);

      const result = await TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/salas');
    });
  });

  describe('onboardingGuard', () => {
    it('should redirect to /login if user is not authenticated', async () => {
      supabaseService.currentSession.set(null);

      const result = await TestBed.runInInjectionContext(() => onboardingGuard({} as any, {} as any));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/login');
    });

    it('should allow access if user is authenticated and profile is incomplete', async () => {
      supabaseService.currentSession.set({ user: { id: 'u1' } } as Session);
      supabaseService.userProfile.set({ id: 'u1', form_completed: false } as Profile);

      const result = await TestBed.runInInjectionContext(() => onboardingGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to /salas if user is authenticated and profile is complete', async () => {
      supabaseService.currentSession.set({ user: { id: 'u1' } } as Session);
      supabaseService.userProfile.set({ id: 'u1', form_completed: true } as Profile);

      const result = await TestBed.runInInjectionContext(() => onboardingGuard({} as any, {} as any));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/salas');
    });
  });

  describe('roomsAccessGuard', () => {
    it('should redirect to /login if user is not authenticated', async () => {
      supabaseService.currentSession.set(null);

      const result = await TestBed.runInInjectionContext(() => roomsAccessGuard({} as any, {} as any));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/login');
    });

    it('should redirect to /onboarding if user is authenticated but profile is incomplete', async () => {
      supabaseService.currentSession.set({ user: { id: 'u1' } } as Session);
      supabaseService.userProfile.set({ id: 'u1', form_completed: false } as Profile);

      const result = await TestBed.runInInjectionContext(() => roomsAccessGuard({} as any, {} as any));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/onboarding');
    });

    it('should allow access if user is authenticated and profile is complete', async () => {
      supabaseService.currentSession.set({ user: { id: 'u1' } } as Session);
      supabaseService.userProfile.set({ id: 'u1', form_completed: true } as Profile);

      const result = await TestBed.runInInjectionContext(() => roomsAccessGuard({} as any, {} as any));
      expect(result).toBe(true);
    });
  });

  describe('SSR Safety', () => {
    it('should always allow activation on server platform', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          SupabaseService,
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });

      const guestResult = await TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(guestResult).toBe(true);

      const onboardingResult = await TestBed.runInInjectionContext(() => onboardingGuard({} as any, {} as any));
      expect(onboardingResult).toBe(true);

      const roomsResult = await TestBed.runInInjectionContext(() => roomsAccessGuard({} as any, {} as any));
      expect(roomsResult).toBe(true);
    });
  });
});
