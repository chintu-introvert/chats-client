import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, AvatarComponent, IconComponent, ChatListComponent],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
    currentUser$!: User;

    constructor(
        private chatService: ChatService,
        private authService: AuthService
    ) {
        this.currentUser$ = this.chatService.getCurrentUser();
    }

    get userBio(): string {
        const u = this.currentUser$;
        return u?.bio || u?.status || 'Hey there! I am using Chats.';
    }

    logout(): void {
        this.authService.logout();
    }
}
