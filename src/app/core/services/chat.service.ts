import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private readonly defaultUser: User = {
        id: 'user1',
        name: 'You',
        avatarUrl: 'https://i.pravatar.cc/150?u=user1',
    };

    private currentUser: User;
    private mockUsers: User[] = [
        { id: 'user2', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?u=user2', status: 'Available' },
        { id: 'user3', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?u=user3', status: 'Busy' },
        { id: 'user4', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?u=user4', status: 'At work' },
    ];

    private mockChats: Chat[] = [];
    private mockMessages: Record<string, Message[]> = {
        'chat1': [
            { id: 'm1', chatId: 'chat1', senderId: 'user1', content: 'Hi Alice!', timestamp: new Date(Date.now() - 1000 * 60 * 60), status: 'read' },
            { id: 'm2', chatId: 'chat1', senderId: 'user2', content: 'Hey, are we still on for tomorrow?', timestamp: new Date(Date.now() - 1000 * 60 * 5), status: 'read' }
        ]
    };

    private chatsSubject: BehaviorSubject<Chat[]>;
    public chats$: Observable<Chat[]>;

    private activeChatSubject = new BehaviorSubject<Chat | null>(null);
    public activeChat$ = this.activeChatSubject.asObservable();

    private messagesSubject = new BehaviorSubject<Message[]>([]);
    public messages$ = this.messagesSubject.asObservable();

    constructor(private authService: AuthService) {
        this.currentUser = this.authService.currentUser ?? this.defaultUser;
        this.buildMockChats();
        this.chatsSubject = new BehaviorSubject<Chat[]>(this.mockChats);
        this.chats$ = this.chatsSubject.asObservable();
    }

    private buildMockChats(): void {
        this.mockChats = [
            {
                id: 'chat1',
                participants: [this.currentUser, this.mockUsers[0]],
                isGroup: false,
                unreadCount: 2,
                lastMessage: {
                    id: 'msg1',
                    chatId: 'chat1',
                    senderId: 'user2',
                    content: 'Hey, are we still on for tomorrow?',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5),
                    status: 'read'
                }
            },
            {
                id: 'chat2',
                participants: [this.currentUser, this.mockUsers[1]],
                isGroup: false,
                unreadCount: 0,
                lastMessage: {
                    id: 'msg2',
                    chatId: 'chat2',
                    senderId: this.currentUser.id,
                    content: 'Sent the documents.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    status: 'read'
                }
            },
            {
                id: 'group1',
                participants: [this.currentUser, ...this.mockUsers],
                isGroup: true,
                groupName: 'Angular Devs',
                groupAvatar: 'https://ui-avatars.com/api/?name=Angular+Devs&background=00a884&color=fff',
                unreadCount: 0,
                lastMessage: {
                    id: 'msg3',
                    chatId: 'group1',
                    senderId: 'user3',
                    content: 'Check out the new standalone components.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
                    status: 'read'
                }
            }
        ];
    }

    getCurrentUser(): User {
        return this.currentUser;
    }

    getChats(): Observable<Chat[]> {
        return this.chats$;
    }

    setActiveChat(chatId: string) {
        const chat = this.mockChats.find(c => c.id === chatId) || null;
        this.activeChatSubject.next(chat);

        // Load messages for this chat
        if (chatId && this.mockMessages[chatId]) {
            this.messagesSubject.next(this.mockMessages[chatId]);
        } else {
            this.messagesSubject.next([]);
        }

        if (chat) {
            chat.unreadCount = 0;
            this.chatsSubject.next([...this.mockChats]);
        }
    }

    sendMessage(chatId: string, content: string) {
        const newMessage: Message = {
            id: Date.now().toString(),
            chatId,
            senderId: this.currentUser.id,
            content,
            timestamp: new Date(),
            status: 'sent'
        };

        if (!this.mockMessages[chatId]) {
            this.mockMessages[chatId] = [];
        }

        this.mockMessages[chatId].push(newMessage);

        // Update last message in chat list
        const chatIndex = this.mockChats.findIndex(c => c.id === chatId);
        if (chatIndex > -1) {
            this.mockChats[chatIndex].lastMessage = newMessage;
            // Move chat to top
            const chat = this.mockChats.splice(chatIndex, 1)[0];
            this.mockChats.unshift(chat);
            this.chatsSubject.next([...this.mockChats]);
        }

        // Update messages view if it's the active chat
        if (this.activeChatSubject.value?.id === chatId) {
            this.messagesSubject.next([...this.mockMessages[chatId]]);
        }

        // Simulate reply after 1.5s
        setTimeout(() => {
            const replyMsg: Message = {
                id: Date.now().toString() + 'r',
                chatId,
                senderId: this.mockChats.find(c => c.id === chatId)?.participants.find(p => p.id !== this.currentUser.id)?.id || 'unknown',
                content: 'Got it!',
                timestamp: new Date(),
                status: 'sent'
            };
            this.mockMessages[chatId].push(replyMsg);
            if (chatIndex > -1) {
                this.mockChats[0].lastMessage = replyMsg;
                if (this.activeChatSubject.value?.id !== chatId) {
                    this.mockChats[0].unreadCount++;
                }
                this.chatsSubject.next([...this.mockChats]);
            }
            if (this.activeChatSubject.value?.id === chatId) {
                this.messagesSubject.next([...this.mockMessages[chatId]]);
            }
        }, 1500);
    }

    pinChat(chatId: string) {
        console.log(`Pinning chat ${chatId} - placeholder implemented in ChatService`);
        // Actual logic to pin the chat would go here
    }

    archiveChat(chatId: string) {
        console.log(`Archiving chat ${chatId} - placeholder implemented in ChatService`);
        // Actual logic to archive the chat would go here
    }

    deleteChat(chatId: string) {
        console.log(`Deleting chat ${chatId} - placeholder implemented in ChatService`);
        // We can optionally implement a mock delete logic if needed
        const chatIndex = this.mockChats.findIndex(c => c.id === chatId);
        if (chatIndex > -1) {
            this.mockChats.splice(chatIndex, 1);
            this.chatsSubject.next([...this.mockChats]);
        }

        if (this.activeChatSubject.value?.id === chatId) {
            this.activeChatSubject.next(null);
            this.messagesSubject.next([]);
        }
    }
}
