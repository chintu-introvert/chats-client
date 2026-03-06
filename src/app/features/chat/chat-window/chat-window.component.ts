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
    activeChat: any;
    private chatSub: Subscription;
    messages$: Observable<any[]>;
    // messages: any;

    newMessage: string = '';

    private previousRoomId: any = null;

    constructor(private chatService: ChatService) {
        this.messages$ = this.chatService.messages$;
        this.chatSub = this.chatService.activeChat$.subscribe((chat: { id: any; roomid: any; }) => {
            this.activeChat = chat;
            // Only fetch messages when the room actually changes,
            // not on every emit (e.g. newRoomCreated updates roomid on same chat)
            if (chat?.roomid && chat.roomid !== this.previousRoomId) {
                this.previousRoomId = chat.roomid;
                this.getmessages(chat.roomid);
            }
        });
    }

    getmessages(id: any) {
        if (!id) return;  // No roomid yet — new chat, nothing to fetch
        this.chatService.getChatMessages(id).subscribe({
            next: (res: any) => {
                if (res.success && res?.data?.length > 0) {
                    // Only overwrite if server actually returned messages.
                    // Prevents race condition where newRoom fires before DB commit.
                    this.chatService.roomMessages = res?.data;
                    this.chatService.messagesSubject.next([...this.chatService.roomMessages]);
                }
                console.log(this.chatService.roomMessages, 'user rooms list');
            },
            error: (err: any) => {
                console.log(err, ' error while fetching messages');
            }
        });
    }

    get currentUserId(): string {
        return this.chatService.getCurrentUser().id;
    }

    get chatName(): string {
        // if (!this.activeChat) return '';
        // if (this.activeChat.isGroup) return this.activeChat.groupName || 'Group';
        // const otherUser = this.activeChat.participants.find(p => p.id !== this.currentUserId);
        // return otherUser ? otherUser.name : 'Unknown';
        return this.activeChat.name;
    }

    get chatAvatar(): string {
        // if (!this.activeChat) return '';
        // if (this.activeChat.isGroup) return this.activeChat.groupAvatar || '';
        // const otherUser = this.activeChat.participants.find(p => p.id !== this.currentUserId);
        // return otherUser ? otherUser.avatarUrl : '';
        return this.activeChat?.profile || 'https://i.pravatar.cc/150?u=' + this.activeChat.id;
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
        setTimeout(() => {
            const messageContainer = document.querySelector('.chat-messages');
            if (messageContainer) {
                messageContainer.scrollTop = messageContainer.scrollHeight;
            }
        }, 0);
    }

    ngOnDestroy() {
        if (this.chatSub) {
            this.chatSub.unsubscribe();
        }
    }
}
