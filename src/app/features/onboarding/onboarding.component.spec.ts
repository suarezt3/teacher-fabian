import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { OnboardingComponent } from './onboarding.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { Profile } from '../../core/models/database.types';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;
  let supabaseService: SupabaseService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [provideRouter([]), SupabaseService],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    supabaseService = TestBed.inject(SupabaseService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create and initialize in Step 1 with FORM view state', () => {
    expect(component).toBeTruthy();
    expect(component.currentStep()).toBe(1);
    expect(component.viewState()).toBe('FORM');
    expect(component.progressPercentage()).toBe(25);
    expect(component.isSaving()).toBe(false);
  });

  it('should resolve userName and userEmail from authenticated profile', () => {
    supabaseService.userProfile.set({
      id: 'usr-10',
      full_name: 'David Guetta',
      email: 'david@example.com',
      form_completed: false,
    } as Profile);

    expect(component.userName()).toBe('David Guetta');
    expect(component.userEmail()).toBe('');
  });

  describe('Step 1 validation and navigation', () => {
    it('should block navigation and display error when step 1 is invalid', () => {
      component.goToNextStep();
      expect(component.currentStep()).toBe(1);
      expect(component.errorMessage()).toContain('Por favor completa todos los campos');
    });

    it('should require custom gender when gender is "Otro"', () => {
      component.form.patchValue({
        whatsapp_number: '+573001234567',
        age: 29,
        country_city: 'Colombia, Cali',
        gender: 'Otro',
        gender_custom: '',
        education_level: 'Universitario en curso',
        occupation: 'Estudiante',
      });

      expect(component.isStep1Valid()).toBe(false);

      component.form.patchValue({ gender_custom: 'No binario fluido' });
      expect(component.isStep1Valid()).toBe(true);
    });

    it('should advance to step 2 when step 1 is fully filled', () => {
      component.form.patchValue({
        whatsapp_number: '+573001234567',
        age: 25,
        country_city: 'Colombia, Bogotá',
        gender: 'Hombre',
        education_level: 'Profesional Universitario',
        occupation: 'Empleado',
        profession_area: 'Ingeniería',
      });

      expect(component.isStep1Valid()).toBe(true);
      component.goToNextStep();
      expect(component.currentStep()).toBe(2);
      expect(component.progressPercentage()).toBe(50);
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('Step 2: English Journey & Zero-study conditional logic', () => {
    beforeEach(() => {
      component.currentStep.set(2);
    });

    it('should block step 2 navigation if no option was chosen', () => {
      component.goToNextStep();
      expect(component.currentStep()).toBe(2);
      expect(component.errorMessage()).toContain('Por favor selecciona tu trayectoria');
    });

    it('should automatically complete study duration and exam when starting from zero and advance to step 3', () => {
      component.selectStudyType('No, estoy comenzando desde cero.');

      expect(component.form.controls.study_duration.value).toBe(
        'No he estudiado inglés formalmente.'
      );
      expect(component.form.controls.international_exam.value).toBe('No.');
      expect(component.isStep2Valid()).toBe(true);

      component.goToNextStep();
      expect(component.currentStep()).toBe(3);
      expect(component.progressPercentage()).toBe(75);
    });

    it('should require duration and exam selection when previous study was chosen', () => {
      component.selectStudyType('Sí, en una academia o instituto.');

      expect(component.isStep2Valid()).toBe(false);

      component.selectStudyDuration('Entre 1 y 3 años.');
      expect(component.isStep2Valid()).toBe(false);

      component.selectInternationalExam('No.');
      expect(component.isStep2Valid()).toBe(true);

      component.goToNextStep();
      expect(component.currentStep()).toBe(3);
    });

    it('should allow returning to step 1 from step 2', () => {
      component.goToPreviousStep();
      expect(component.currentStep()).toBe(1);
    });
  });

  describe('Step 3: Conversational Self-Assessment and Goals', () => {
    beforeEach(() => {
      component.currentStep.set(3);
    });

    it('should toggle learning goals and check selection properly', () => {
      expect(component.isGoalSelected('Mejorar mi fluidez al hablar.')).toBe(false);

      component.toggleLearningGoal('Mejorar mi fluidez al hablar.');
      expect(component.isGoalSelected('Mejorar mi fluidez al hablar.')).toBe(true);

      component.toggleLearningGoal('Mejorar mi fluidez al hablar.');
      expect(component.isGoalSelected('Mejorar mi fluidez al hablar.')).toBe(false);
    });

    it('should validate step 3 only when level, comfort, club experience and at least 1 goal exist', () => {
      expect(component.isStep3Valid()).toBe(false);

      component.selectEnglishLevel('B2');
      component.selectSpeakingComfort('Cómodo(a), aunque cometo algunos errores.');
      component.selectClubExperience('Sí, algunas veces.');
      expect(component.isStep3Valid()).toBe(false);

      component.toggleLearningGoal('Mejorar mi fluidez al hablar.');
      expect(component.isStep3Valid()).toBe(true);

      component.goToNextStep();
      expect(component.currentStep()).toBe(4);
      expect(component.progressPercentage()).toBe(100);
    });
  });

  describe('Step 4: Privacy Authorization & Bifurcation', () => {
    beforeEach(() => {
      component.currentStep.set(4);
      component.form.patchValue({
        whatsapp_number: '+573001234567',
        age: 26,
        country_city: 'Colombia, Medellín',
        gender: 'Mujer',
        education_level: 'Profesional Universitario',
        occupation: 'Trabajador Independiente',
        previous_study_type: 'No, estoy comenzando desde cero.',
        study_duration: 'No he estudiado inglés formalmente.',
        international_exam: 'No.',
        english_level: 'B1',
        speaking_comfort: 'Cómodo(a), aunque cometo algunos errores.',
        previous_club_experience: 'No, sería mi primera experiencia.',
        learning_goals: ['Mejorar mi fluidez al hablar.'],
      });
    });

    it('should branch to DECLINED_PRIVACY view when user declines authorization without saving', async () => {
      const saveSpy = vi.spyOn(supabaseService, 'saveOnboardingProfile');

      component.selectPrivacyConsent('NO_AUTORIZO');
      await component.handleStep4Submit();

      expect(saveSpy).not.toHaveBeenCalled();
      expect(component.viewState()).toBe('DECLINED_PRIVACY');
    });

    it('should allow returning from DECLINED_PRIVACY to step 4 preserving form values', () => {
      component.viewState.set('DECLINED_PRIVACY');

      component.returnToStep4AfterDeclining();

      expect(component.viewState()).toBe('FORM');
      expect(component.currentStep()).toBe(4);
      expect(component.form.controls.whatsapp_number.value).toBe('+573001234567');
      expect(component.form.controls.english_level.value).toBe('B1');
    });

    it('should sign out and navigate to /landing from DECLINED_PRIVACY view', async () => {
      const signOutSpy = vi.spyOn(supabaseService, 'signOut').mockResolvedValue({ error: null });
      const navigateSpy = vi.spyOn(router, 'navigate');

      await component.handleSignOutAndExit();

      expect(signOutSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/landing']);
    });

    it('should save profile and transition to SUCCESS when user authorizes data processing', async () => {
      const saveSpy = vi.spyOn(supabaseService, 'saveOnboardingProfile').mockResolvedValue({
        profile: {
          id: 'u-1',
          full_name: 'Camila',
          email: 'camila@example.com',
          form_completed: true,
          data_processing_authorized: true,
        } as Profile,
        error: null,
      });

      component.selectPrivacyConsent('AUTORIZO');
      await component.handleStep4Submit();

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          whatsapp_number: '+573001234567',
          english_level: 'B1',
        })
      );
      expect(component.viewState()).toBe('SUCCESS');
    });

    it('should display error message if saveOnboardingProfile fails', async () => {
      vi.spyOn(supabaseService, 'saveOnboardingProfile').mockResolvedValue({
        profile: null,
        error: 'Error temporal al guardar el perfil.',
      });

      component.selectPrivacyConsent('AUTORIZO');
      await component.handleStep4Submit();

      expect(component.errorMessage()).toBe('Error temporal al guardar el perfil.');
      expect(component.viewState()).toBe('FORM');
    });

    it('should navigate to /salas when clicking action in SUCCESS view', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.navigateToRooms();

      expect(navigateSpy).toHaveBeenCalledWith(['/salas']);
    });
  });

  describe('Sign Out from header', () => {
    it('should sign out and navigate to /login', async () => {
      const signOutSpy = vi.spyOn(supabaseService, 'signOut').mockResolvedValue({ error: null });
      const navigateSpy = vi.spyOn(router, 'navigate');

      await component.handleSignOut();

      expect(signOutSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
