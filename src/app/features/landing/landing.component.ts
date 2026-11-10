import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  arrowRightIcon,
  checkCircleIcon,
  flightIcon,
  briefcaseIcon,
  micIcon,
  movieIcon,
  starIcon,
  chatConversationIcon,
} from '../../shared/icons/hugeicons';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, HugeiconsIconComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private readonly router = inject(Router);

  // Hugeicons references
  protected readonly arrowRightIcon = arrowRightIcon;
  protected readonly checkCircleIcon = checkCircleIcon;
  protected readonly flightIcon = flightIcon;
  protected readonly briefcaseIcon = briefcaseIcon;
  protected readonly micIcon = micIcon;
  protected readonly movieIcon = movieIcon;
  protected readonly starIcon = starIcon;
  protected readonly chatConversationIcon = chatConversationIcon;

  // Weekly topics list
  protected readonly weeklyTopics = [
    { title: 'Inteligencia Artificial y el Futuro', icon: micIcon },
    { title: 'Historias de viajes y choques culturales', icon: flightIcon },
    { title: 'Negociación y entrevistas laborales', icon: briefcaseIcon },
    { title: 'Debates de cine y series', icon: movieIcon },
  ];

  // Circle methodology steps
  protected readonly circleSteps = [
    {
      step: 1,
      title: 'Crea tu perfil y elige tu nivel',
      description:
        'Selecciona si estás en nivel intermedio (B1), fluido (B2) o avanzado (C1) y marca los temas que te interesan debatir.',
    },
    {
      step: 2,
      title: 'Entra a tu salón con Teacher Fabian',
      description:
        'Encuentros semanales en vivo de 60 minutos con preguntas disparadoras, juegos de rol y retroalimentación personalizada.',
    },
    {
      step: 3,
      title: 'Feedback táctico sin interrupciones',
      description:
        'Al finalizar cada sesión recibes notas de vocabulario nativo, giros idiomáticos y pronunciación sin cortar tu ritmo al hablar.',
    },
  ];

  protected navigateToRegister(): void {
    void this.router.navigate(['/registro']);
  }
}
