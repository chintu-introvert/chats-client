import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat } from '../../../core/models/chat.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
    selector: 'app-chat-list-item',
    standalone: true,
    imports: [CommonModule, AvatarComponent],
    templateUrl: './chat-list-item.component.html',
    styleUrls: ['./chat-list-item.component.css']
})
export class ChatListItemComponent {
    @Input() chat!: Chat;
    @Input() isActive: boolean = false;

    get chatName(): string {
        if (this.chat.isGroup) {
            return this.chat.groupName || 'Group';
        } else {
            // Find the other participant
            const otherUser = this.chat.participants.find(p => p.id !== 'user1'); // Assuming 'user1' is current user id based on service mock
            return otherUser ? otherUser.name : 'Unknown';
        }
    }

    get chatAvatar(): string {
        if (this.chat.isGroup) {
            return this.chat.groupAvatar || '';
        } else {
            const otherUser = this.chat.participants.find(p => p.id !== 'user1');
            return otherUser ? otherUser.avatarUrl : '';
        }
    }

    get lastMessageTime(): string {
        if (!this.chat.lastMessage) return '';
        const date = new Date(this.chat.lastMessage.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
