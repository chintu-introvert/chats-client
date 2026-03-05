import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat } from '../../../core/models/chat.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ChatService } from '../../../core/services/chat.service';

@Component({
    selector: 'app-chat-list-item',
    standalone: true,
    imports: [CommonModule, AvatarComponent],
    templateUrl: './chat-list-item.component.html',
    styleUrls: ['./chat-list-item.component.css']
})
export class ChatListItemComponent {
    @Input() chat!: any;
    @Input() isActive: boolean = false;

    isMenuOpen = false;

    constructor(
        private chatService: ChatService,
        private elementRef: ElementRef
    ) { }

    get currentUserId(): string {
        return this.chatService.getCurrentUser().id;
    }

    get chatName(): string {
        // if (this.chat.isGroup) {
        //     return this.chat.groupName || 'Group';
        // } else {
        //     const otherUser = this.chat.participants.find(p => p.id !== this.currentUserId);
        //     return otherUser ? otherUser.name : 'Unknown';
        // }
        return this.chat?.name || '';
    }

    get chatAvatar(): string {
        // if (this.chat.isGroup) {
        //     return this.chat.groupAvatar || '';
        // } else {
        //     const otherUser = this.chat.participants.find(p => p.id !== this.currentUserId);
        //     return otherUser ? otherUser.avatarUrl : '';
        // }
        return this.chat?.profile || 'https://i.pravatar.cc/150?u='+this.chat.id;
    }

    get lastMessageTime(): string {
        if (!this.chat.lastMessage) return '';
        const date = new Date(this.chat.lastMessage.created_at);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    toggleMenu(event: Event) {
        event.stopPropagation();
        this.isMenuOpen = !this.isMenuOpen;
    }

    onPin(event: Event) {
        event.stopPropagation();
        this.chatService.pinChat(this.chat.id);
        this.isMenuOpen = false;
    }

    onArchive(event: Event) {
        event.stopPropagation();
        this.chatService.archiveChat(this.chat.id);
        this.isMenuOpen = false;
    }

    onDelete(event: Event) {
        event.stopPropagation();
        this.chatService.deleteChat(this.chat.id);
        this.isMenuOpen = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event) {
        if (this.isMenuOpen && !this.elementRef.nativeElement.contains(event.target)) {
            this.isMenuOpen = false;
        }
    }
}
