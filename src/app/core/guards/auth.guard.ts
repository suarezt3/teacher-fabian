import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/**
 * Guest Guard: protects /login and /registro routes.
 * If user is already authenticated:
 * - if form_completed is true -> redirect to /salas
 * - else -> redirect to /onboarding
 */
export const guestGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const supabase = inject(SupabaseService);
  const router = inject(Router);

  await supabase.waitForAuthInit();

  const session = supabase.currentSession();
  if (session) {
    const profile = supabase.userProfile();
    if (profile?.form_completed) {
      return router.createUrlTree(['/salas']);
    }
    return router.createUrlTree(['/onboarding']);
  }

  return true;
};

/**
 * Onboarding Guard: protects /onboarding route.
 * - If not authenticated -> redirect to /login
 * - If authenticated and form_completed is true -> redirect to /salas
 * - Else (authenticated but profile incomplete) -> allow access
 */
export const onboardingGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const supabase = inject(SupabaseService);
  const router = inject(Router);

  await supabase.waitForAuthInit();

  const session = supabase.currentSession();
  if (!session) {
    return router.createUrlTree(['/login']);
  }

  const profile = supabase.userProfile();
  if (profile?.form_completed) {
    return router.createUrlTree(['/salas']);
  }

  return true;
};

/**
 * Rooms Access Guard: protects /salas route.
 * - If not authenticated -> redirect to /login
 * - If authenticated and !form_completed -> redirect to /onboarding
 * - If authenticated and form_completed -> allow access
 */
export const roomsAccessGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const supabase = inject(SupabaseService);
  const router = inject(Router);

  await supabase.waitForAuthInit();

  const session = supabase.currentSession();
  if (!session) {
    return router.createUrlTree(['/login']);
  }

  const profile = supabase.userProfile();
  if (!profile?.form_completed) {
    return router.createUrlTree(['/onboarding']);
  }

  return true;
};
