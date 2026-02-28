import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ChatService } from '../../../core/services/chat.service';
import { Chat } from '../../../core/models/chat.model';
import { Subscription, Observable } from 'rxjs';
import { Message } from '../../../core/models/message.model';

@Component({
    selector: 'app-chat-window',
    standalone: true,
    imports: [CommonModule, FormsModule, AvatarComponent, IconComponent],
    templateUrl: './chat-window.component.html',
    styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnDestroy {
    activeChat: Chat | null = null;
    private chatSub: Subscription;
    messages$: Observable<Message[]>;

    newMessage: string = '';

    constructor(private chatService: ChatService) {
        this.messages$ = this.chatService.messages$;
        this.chatSub = this.chatService.activeChat$.subscribe(chat => {
            this.activeChat = chat;
        });
    }

    get currentUserId(): string {
        return this.chatService.getCurrentUser().id;
    }

    get chatName(): string {
        if (!this.activeChat) return '';
        if (this.activeChat.isGroup) return this.activeChat.groupName || 'Group';
        const otherUser = this.activeChat.participants.find(p => p.id !== this.currentUserId);
        return otherUser ? otherUser.name : 'Unknown';
    }

    get chatAvatar(): string {
        if (!this.activeChat) return '';
        if (this.activeChat.isGroup) return this.activeChat.groupAvatar || '';
        const otherUser = this.activeChat.participants.find(p => p.id !== this.currentUserId);
        return otherUser ? otherUser.avatarUrl : '';
    }

    sendMessage() {
        if (this.newMessage.trim() && this.activeChat) {
            this.chatService.sendMessage(this.activeChat.id, this.newMessage);
            this.newMessage = '';
        }
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    // Helper method to scroll to bottom, will call via template
    ngAfterViewChecked() {
        const messageContainer = document.querySelector('.chat-messages');
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    }

    ngOnDestroy() {
        if (this.chatSub) {
            this.chatSub.unsubscribe();
        }
    }
}
