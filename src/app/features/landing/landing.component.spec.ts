import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the landing component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the main headline', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1?.textContent).toContain('Habla inglés con soltura en conversaciones reales');
  });

  it('should render social proof metrics', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('96%');
    expect(compiled.textContent).toContain('6 max');
    expect(compiled.textContent).toContain('+1,200');
  });

  it('should render circle methodology steps', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('¿Cómo funcionan los círculos?');
    expect(compiled.textContent).toContain('Crea tu perfil y elige tu nivel');
    expect(compiled.textContent).toContain('Entra a tu salón con Teacher Fabian');
    expect(compiled.textContent).toContain('Feedback táctico sin interrupciones');
  });

  it('should render trust seals in hero section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sin exámenes estresantes');
    expect(compiled.textContent).toContain('Prueba de nivel incluida');
  });

  it('should render all 4 weekly topics', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inteligencia Artificial y el Futuro');
    expect(compiled.textContent).toContain('Historias de viajes y choques culturales');
    expect(compiled.textContent).toContain('Negociación y entrevistas laborales');
    expect(compiled.textContent).toContain('Debates de cine y series');
  });

  it('should render the student testimonial', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Marcela Castro');
    expect(compiled.textContent).toContain('Tenía años estudiando gramática pero me bloqueaba');
  });

  it('should render CTA links pointing to /registro', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const registerLinks = compiled.querySelectorAll('a[href="/registro"]');
    expect(registerLinks.length).toBeGreaterThan(0);
  });

  it('should navigate to /registro when navigateToRegister is invoked', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component['navigateToRegister']();
    expect(navigateSpy).toHaveBeenCalledWith(['/registro']);
  });
});
