import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { EnglishLevel, OnboardingPayload } from '../../core/models/database.types';
import { SupabaseService } from '../../core/services/supabase.service';
import {
  arrowLeftIcon,
  arrowRightIcon,
  badgeIcon,
  bookOpenIcon,
  calendarIcon,
  chatConversationIcon,
  checkCircleIcon,
  checkIcon,
  infoCircleIcon,
  logoutIcon,
  phoneIcon,
  shieldIcon,
  sparklesIcon,
  starIcon,
  targetIcon,
  userIcon,
  verifiedIcon,
} from '../../shared/icons/hugeicons';

export type OnboardingViewState = 'FORM' | 'DECLINED_PRIVACY' | 'SUCCESS';

export interface EnglishLevelOption {
  code: EnglishLevel;
  badge: string;
  label: string;
  desc: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, HugeiconsIconComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  private readonly fb = inject(NonNullableFormBuilder);

  // View state signals
  readonly currentStep = signal<1 | 2 | 3 | 4>(1);
  readonly viewState = signal<OnboardingViewState>('FORM');
  readonly isSaving = signal<boolean>(false);
  readonly isSigningOut = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Hugeicons
  protected readonly arrowLeftIcon = arrowLeftIcon;
  protected readonly arrowRightIcon = arrowRightIcon;
  protected readonly badgeIcon = badgeIcon;
  protected readonly bookOpenIcon = bookOpenIcon;
  protected readonly calendarIcon = calendarIcon;
  protected readonly chatConversationIcon = chatConversationIcon;
  protected readonly checkCircleIcon = checkCircleIcon;
  protected readonly checkIcon = checkIcon;
  protected readonly infoCircleIcon = infoCircleIcon;
  protected readonly logoutIcon = logoutIcon;
  protected readonly phoneIcon = phoneIcon;
  protected readonly shieldIcon = shieldIcon;
  protected readonly sparklesIcon = sparklesIcon;
  protected readonly starIcon = starIcon;
  protected readonly targetIcon = targetIcon;
  protected readonly userIcon = userIcon;
  protected readonly verifiedIcon = verifiedIcon;

  // Options catalogs
  readonly genderOptions = [
    'Mujer',
    'Hombre',
    'Prefiero no decirlo',
    'Otro',
  ] as const;

  readonly educationOptions = [
    'Educación Básica Primaria',
    'Educación Básica Secundaria',
    'Educación Media (Bachillerato)',
    'Técnico',
    'Tecnólogo',
    'Profesional Universitario',
    'Especialización',
    'Maestría',
    'Doctorado',
    'Otro',
  ] as const;

  readonly occupationOptions = [
    'Estudiante',
    'Empleado',
    'Trabajador Independiente',
    'Docente',
    'Desempleado',
    'Otro',
  ] as const;

  readonly studyTypeOptions = [
    'Sí, en el colegio.',
    'Sí, en una academia o instituto.',
    'Sí, con un profesor particular.',
    'Sí, de manera autodidacta.',
    'He tenido experiencias de aprendizaje en varios de estos espacios.',
    'No, estoy comenzando desde cero.',
  ] as const;

  readonly studyDurationOptions = [
    'Menos de 6 meses.',
    'Entre 6 meses y 1 año.',
    'Entre 1 y 3 años.',
    'Entre 3 y 5 años.',
    'Más de 5 años.',
    'No he estudiado inglés formalmente.',
  ] as const;

  readonly internationalExamOptions = [
    'Sí, Cambridge.',
    'Sí, IELTS.',
    'Sí, TOEFL.',
    'Sí, otro examen.',
    'No.',
  ] as const;

  readonly englishLevelOptions: EnglishLevelOption[] = [
    {
      code: 'A1',
      badge: 'A1',
      label: 'Principiante',
      desc: 'Frases y vocabulario básico para saludar y presentarme.',
    },
    {
      code: 'A2',
      badge: 'A2',
      label: 'Básico',
      desc: 'Conversaciones sencillas cotidianas y descripción de rutinas.',
    },
    {
      code: 'B1',
      badge: 'B1',
      label: 'Intermedio',
      desc: 'Puedo comunicarme y explicar mis ideas con cierta soltura.',
    },
    {
      code: 'B2',
      badge: 'B2',
      label: 'Intermedio alto',
      desc: 'Fluidez sólida, participo en debates y comprendo detalles.',
    },
    {
      code: 'C1',
      badge: 'C1',
      label: 'Avanzado',
      desc: 'Uso espontáneo, vocabulario amplio y matices culturales.',
    },
    {
      code: 'C2',
      badge: 'C2',
      label: 'Dominio avanzado',
      desc: 'Dominio completo del idioma con precisión y naturalidad.',
    },
    {
      code: 'NO_CONOZCO',
      badge: '?',
      label: 'No conozco mi nivel',
      desc: '¡No te preocupes! Lo descubriremos juntos en las mesas.',
    },
  ];

  readonly speakingComfortOptions = [
    'Muy cómodo(a): puedo mantener conversaciones.',
    'Cómodo(a), aunque cometo algunos errores.',
    'Entiendo bastante, pero me cuesta hablar.',
    'Tengo dificultades para expresarme.',
    'Apenas estoy comenzando.',
  ] as const;

  readonly clubExperienceOptions = [
    'Sí, frecuentemente.',
    'Sí, algunas veces.',
    'No, sería mi primera experiencia.',
  ] as const;

  readonly learningGoalOptions = [
    'Mejorar mi fluidez al hablar.',
    'Mejorar mi pronunciación.',
    'Ampliar mi vocabulario.',
    'Perder el miedo o la vergüenza de hablar inglés.',
    'Mejorar mi comprensión auditiva.',
    'Practicar para estudios o trabajo.',
    'Mantener y fortalecer mi nivel actual.',
    'Otros.',
  ] as const;

  // Reactive Form
  readonly form = this.fb.group({
    // Step 1
    whatsapp_number: ['', [Validators.required, Validators.minLength(7)]],
    age: [
      null as number | null,
      [Validators.required, Validators.min(10), Validators.max(100)],
    ],
    country_city: ['', [Validators.required, Validators.minLength(3)]],
    gender: ['', [Validators.required]],
    gender_custom: [''],
    education_level: ['', [Validators.required]],
    occupation: ['', [Validators.required]],
    profession_area: [''],

    // Step 2
    previous_study_type: ['', [Validators.required]],
    study_duration: [''],
    international_exam: [''],

    // Step 3
    english_level: [null as EnglishLevel | null, [Validators.required]],
    speaking_comfort: ['', [Validators.required]],
    previous_club_experience: ['', [Validators.required]],
    learning_goals: this.fb.control<string[]>([]),

    // Step 4
    privacy_consent: [null as 'AUTORIZO' | 'NO_AUTORIZO' | null, [Validators.required]],
  });

  // User identity computed
  readonly userName = computed<string>(() => {
    const profile = this.supabaseService.userProfile();
    const user = this.supabaseService.currentUser();
    const metaName = (
      (user?.user_metadata?.['full_name'] as string) ||
      (user?.user_metadata?.['name'] as string) ||
      ''
    ).trim();

    return profile?.full_name?.trim() || metaName || 'Miembro';
  });

  readonly userEmail = computed<string>(() => {
    return this.supabaseService.currentUser()?.email || '';
  });

  // Progress percentage
  readonly progressPercentage = computed<number>(() => {
    switch (this.currentStep()) {
      case 1:
        return 25;
      case 2:
        return 50;
      case 3:
        return 75;
      case 4:
        return 100;
    }
  });

  // Step validation helpers
  isStep1Valid(): boolean {
    const v = this.form.getRawValue();
    const hasPhone = !!v.whatsapp_number && v.whatsapp_number.trim().length >= 7;
    const hasAge = v.age !== null && v.age >= 10 && v.age <= 100;
    const hasCity = !!v.country_city && v.country_city.trim().length >= 3;
    const hasGender =
      !!v.gender && (v.gender !== 'Otro' || (!!v.gender_custom && v.gender_custom.trim().length > 0));
    const hasEdu = !!v.education_level;
    const hasOcc = !!v.occupation;

    return hasPhone && hasAge && hasCity && hasGender && hasEdu && hasOcc;
  }

  isStep2Valid(): boolean {
    const v = this.form.getRawValue();
    if (!v.previous_study_type) {
      return false;
    }
    if (v.previous_study_type === 'No, estoy comenzando desde cero.') {
      return true;
    }
    return !!v.study_duration && !!v.international_exam;
  }

  isStep3Valid(): boolean {
    const v = this.form.getRawValue();
    const hasLevel = !!v.english_level;
    const hasComfort = !!v.speaking_comfort;
    const hasClubExp = !!v.previous_club_experience;
    const hasGoals = Array.isArray(v.learning_goals) && v.learning_goals.length > 0;

    return hasLevel && hasComfort && hasClubExp && hasGoals;
  }

  isStep4Valid(): boolean {
    return this.form.controls.privacy_consent.value !== null;
  }

  // Step Navigation
  goToNextStep(): void {
    const current = this.currentStep();
    this.errorMessage.set(null);

    if (current === 1) {
      if (!this.isStep1Valid()) {
        this.errorMessage.set('Por favor completa todos los campos requeridos del Paso 1.');
        this.markStep1ControlsTouched();
        return;
      }
      this.currentStep.set(2);
    } else if (current === 2) {
      if (!this.isStep2Valid()) {
        this.errorMessage.set('Por favor selecciona tu trayectoria con el idioma inglés.');
        this.form.controls.previous_study_type.markAsTouched();
        return;
      }
      this.currentStep.set(3);
    } else if (current === 3) {
      if (!this.isStep3Valid()) {
        this.errorMessage.set('Por favor responde las preguntas de autodiagnóstico y selecciona al menos un objetivo.');
        return;
      }
      this.currentStep.set(4);
    }
  }

  goToPreviousStep(): void {
    const current = this.currentStep();
    this.errorMessage.set(null);
    if (current > 1) {
      this.currentStep.set((current - 1) as 1 | 2 | 3);
    }
  }

  // Chip Selection Handlers
  selectGender(gender: string): void {
    this.form.controls.gender.setValue(gender);
    if (gender !== 'Otro') {
      this.form.controls.gender_custom.setValue('');
    }
    this.errorMessage.set(null);
  }

  selectEducation(education: string): void {
    this.form.controls.education_level.setValue(education);
    this.errorMessage.set(null);
  }

  selectOccupation(occ: string): void {
    this.form.controls.occupation.setValue(occ);
    this.errorMessage.set(null);
  }

  selectStudyType(type: string): void {
    this.form.controls.previous_study_type.setValue(type);
    if (type === 'No, estoy comenzando desde cero.') {
      this.form.patchValue({
        study_duration: 'No he estudiado inglés formalmente.',
        international_exam: 'No.',
      });
    } else {
      if (this.form.controls.study_duration.value === 'No he estudiado inglés formalmente.') {
        this.form.controls.study_duration.setValue('');
      }
      if (this.form.controls.international_exam.value === 'No.') {
        this.form.controls.international_exam.setValue('');
      }
    }
    this.errorMessage.set(null);
  }

  selectStudyDuration(duration: string): void {
    this.form.controls.study_duration.setValue(duration);
    this.errorMessage.set(null);
  }

  selectInternationalExam(exam: string): void {
    this.form.controls.international_exam.setValue(exam);
    this.errorMessage.set(null);
  }

  selectEnglishLevel(level: EnglishLevel): void {
    this.form.controls.english_level.setValue(level);
    this.errorMessage.set(null);
  }

  selectSpeakingComfort(comfort: string): void {
    this.form.controls.speaking_comfort.setValue(comfort);
    this.errorMessage.set(null);
  }

  selectClubExperience(experience: string): void {
    this.form.controls.previous_club_experience.setValue(experience);
    this.errorMessage.set(null);
  }

  toggleLearningGoal(goal: string): void {
    const current = this.form.controls.learning_goals.value || [];
    if (current.includes(goal)) {
      this.form.controls.learning_goals.setValue(current.filter((g) => g !== goal));
    } else {
      this.form.controls.learning_goals.setValue([...current, goal]);
    }
    this.errorMessage.set(null);
  }

  isGoalSelected(goal: string): boolean {
    return (this.form.controls.learning_goals.value || []).includes(goal);
  }

  selectPrivacyConsent(consent: 'AUTORIZO' | 'NO_AUTORIZO'): void {
    this.form.controls.privacy_consent.setValue(consent);
    this.errorMessage.set(null);
  }

  // Submission / Bifurcation Handler
  async handleStep4Submit(): Promise<void> {
    const consent = this.form.controls.privacy_consent.value;
    if (!consent) {
      this.errorMessage.set('Por favor indica si autorizas o no el tratamiento de tus datos personales.');
      return;
    }

    if (consent === 'NO_AUTORIZO') {
      // Bifurcation: Declined privacy
      this.viewState.set('DECLINED_PRIVACY');
      return;
    }

    // User authorized: save profile
    const v = this.form.getRawValue();
    const resolvedGender =
      v.gender === 'Otro' ? v.gender_custom.trim() || 'Otro' : v.gender;

    const payload: OnboardingPayload = {
      whatsapp_number: v.whatsapp_number.trim(),
      age: Number(v.age),
      country_city: v.country_city.trim(),
      gender: resolvedGender,
      education_level: v.education_level,
      occupation: v.occupation,
      profession_area: v.profession_area?.trim() || null,
      previous_study_type: v.previous_study_type,
      study_duration: v.study_duration || 'No he estudiado inglés formalmente.',
      international_exam: v.international_exam || 'No.',
      english_level: v.english_level || 'NO_CONOZCO',
      speaking_comfort: v.speaking_comfort,
      previous_club_experience: v.previous_club_experience,
      learning_goals: v.learning_goals,
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const res = await this.supabaseService.saveOnboardingProfile(payload);
    this.isSaving.set(false);

    if (res.error) {
      this.errorMessage.set(res.error);
      return;
    }

    this.viewState.set('SUCCESS');
  }

  returnToStep4AfterDeclining(): void {
    this.viewState.set('FORM');
    this.currentStep.set(4);
    this.form.controls.privacy_consent.setValue(null);
  }

  navigateToRooms(): void {
    void this.router.navigate(['/salas']);
  }

  async handleSignOutAndExit(): Promise<void> {
    this.isSigningOut.set(true);
    await this.supabaseService.signOut();
    this.isSigningOut.set(false);
    void this.router.navigate(['/landing']);
  }

  async handleSignOut(): Promise<void> {
    this.isSigningOut.set(true);
    await this.supabaseService.signOut();
    this.isSigningOut.set(false);
    void this.router.navigate(['/login']);
  }

  private markStep1ControlsTouched(): void {
    this.form.controls.whatsapp_number.markAsTouched();
    this.form.controls.age.markAsTouched();
    this.form.controls.country_city.markAsTouched();
    this.form.controls.gender.markAsTouched();
    this.form.controls.education_level.markAsTouched();
    this.form.controls.occupation.markAsTouched();
  }
}
