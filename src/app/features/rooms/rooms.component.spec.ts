import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RoomsComponent } from './rooms.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { Profile } from '../../core/models/database.types';

describe('RoomsComponent', () => {
  let component: RoomsComponent;
  let fixture: ComponentFixture<RoomsComponent>;
  let supabaseService: SupabaseService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomsComponent],
      providers: [
        provideRouter([]),
        SupabaseService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomsComponent);
    component = fixture.componentInstance;
    supabaseService = TestBed.inject(SupabaseService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create and render rooms list', () => {
    expect(component).toBeTruthy();
    expect(component.isSigningOut()).toBe(false);
  });

  it('should resolve member name and fluency level', () => {
    supabaseService.userProfile.set({
      id: 'u-1',
      full_name: 'Carlos Ruiz',
      email: 'carlos@example.com',
      english_level: 'C1',
      form_completed: true,
    } as Profile);

    expect(component.memberName()).toBe('Carlos Ruiz');
    expect(component.englishLevel()).toBe('C1');
  });

  it('should handle signOut and navigate to /login', async () => {
    const signOutSpy = vi.spyOn(supabaseService, 'signOut').mockResolvedValue({ error: null });
    const navigateSpy = vi.spyOn(router, 'navigate');

    await component.handleSignOut();

    expect(signOutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(component.isSigningOut()).toBe(false);
  });
});
