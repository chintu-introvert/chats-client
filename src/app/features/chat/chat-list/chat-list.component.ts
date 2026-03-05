import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../../core/services/chat.service';
import { ChatListItemComponent } from '../chat-list-item/chat-list-item.component';
import { Observable } from 'rxjs';
import { Chat } from '../../../core/models/chat.model';

@Component({
    selector: 'app-chat-list',
    standalone: true,
    imports: [CommonModule, ChatListItemComponent],
    templateUrl: './chat-list.component.html',
    styleUrls: ['./chat-list.component.css']
})
export class ChatListComponent {
    chats$: Observable<any[]>;
    activeChatId: string | null = null;

    constructor(private chatService: ChatService) {
        this.chats$ = this.chatService.getChats();
        this.chatService.activeChat$.subscribe((chat: { id: string | null; }) => {
            this.activeChatId = chat ? chat.id : null;
        });
    }

    onChatSelected(chatId: string) {
        this.chatService.setActiveChat(chatId);
    }
}
