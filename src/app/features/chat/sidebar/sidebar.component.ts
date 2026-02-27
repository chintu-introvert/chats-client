import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { ChatService } from '../../../core/services/chat.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, AvatarComponent, IconComponent, ChatListComponent],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
    currentUser$ = this.chatService.getCurrentUser();

    constructor(private chatService: ChatService) { }
}
