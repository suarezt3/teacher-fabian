import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { SupabaseService } from '../../core/services/supabase.service';
import {
  arrowRightIcon,
  badgeIcon,
  calendarIcon,
  chatConversationIcon,
  checkCircleIcon,
  logoutIcon,
  userIcon,
  videoCameraIcon,
} from '../../shared/icons/hugeicons';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [HugeiconsIconComponent],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomsComponent {
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);

  readonly isSigningOut = signal<boolean>(false);

  // Hugeicons
  protected readonly arrowRightIcon = arrowRightIcon;
  protected readonly badgeIcon = badgeIcon;
  protected readonly calendarIcon = calendarIcon;
  protected readonly chatConversationIcon = chatConversationIcon;
  protected readonly checkCircleIcon = checkCircleIcon;
  protected readonly logoutIcon = logoutIcon;
  protected readonly userIcon = userIcon;
  protected readonly videoCameraIcon = videoCameraIcon;

  readonly memberName = computed<string>(() => {
    const profile = this.supabaseService.userProfile();
    const user = this.supabaseService.currentUser();
    const metaName = (
      (user?.user_metadata?.['full_name'] as string) ||
      (user?.user_metadata?.['name'] as string) ||
      ''
    ).trim();

    return profile?.full_name?.trim() || metaName || 'Miembro';
  });

  readonly englishLevel = computed<string>(() => {
    return this.supabaseService.userProfile()?.english_level || 'B2';
  });

  async handleSignOut(): Promise<void> {
    this.isSigningOut.set(true);
    await this.supabaseService.signOut();
    this.isSigningOut.set(false);
    void this.router.navigate(['/login']);
  }
}
