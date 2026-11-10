import { Routes } from '@angular/router';
import { guestGuard, onboardingGuard, roomsAccessGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing',
  },
  {
    path: 'landing',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'onboarding',
    canActivate: [onboardingGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then(
        (m) => m.OnboardingComponent
      ),
  },
  {
    path: 'salas',
    canActivate: [roomsAccessGuard],
    loadComponent: () =>
      import('./features/rooms/rooms.component').then(
        (m) => m.RoomsComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'landing',
  },
];
