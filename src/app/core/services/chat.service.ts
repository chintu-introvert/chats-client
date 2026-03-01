import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root'
})
export class ChatService {


    private readonly defaultUser: User = {
        id: 'user1',
        name: 'You',
        avatarUrl: 'https://i.pravatar.cc/150?u=user1',
    };

    private currentUser
    private mockUsers: User[] = [
        // { id: 'user2', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?u=user2', status: 'Available' },
        // { id: 'user3', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?u=user3', status: 'Busy' },
        // { id: 'user4', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?u=user4', status: 'At work' },
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

    // Socket.io connection instance
    private socket: Socket | null = null;

    constructor(private authService: AuthService, private http: HttpClient) {
        this.currentUser = this.authService.currentUser ?? this.defaultUser;
        this.buildMockChats();
        this.chatsSubject = new BehaviorSubject<Chat[]>(this.mockChats);
        this.chats$ = this.chatsSubject.asObservable();
    }

    private buildMockChats(): void {
        this.mockChats = [
            // {
            //     id: 'chat1',
            //     participants: [this.currentUser, this.mockUsers[0]],
            //     isGroup: false,
            //     unreadCount: 2,
            //     lastMessage: {
            //         id: 'msg1',
            //         chatId: 'chat1',
            //         senderId: 'user2',
            //         content: 'Hey, are we still on for tomorrow?',
            //         timestamp: new Date(Date.now() - 1000 * 60 * 5),
            //         status: 'read'
            //     }
            // },
            // {
            //     id: 'chat2',
            //     participants: [this.currentUser, this.mockUsers[1]],
            //     isGroup: false,
            //     unreadCount: 0,
            //     lastMessage: {
            //         id: 'msg2',
            //         chatId: 'chat2',
            //         senderId: this.currentUser.id,
            //         content: 'Sent the documents.',
            //         timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            //         status: 'read'
            //     }
            // },
            // {
            //     id: 'group1',
            //     participants: [this.currentUser, ...this.mockUsers],
            //     isGroup: true,
            //     groupName: 'Angular Devs',
            //     groupAvatar: 'https://ui-avatars.com/api/?name=Angular+Devs&background=00a884&color=fff',
            //     unreadCount: 0,
            //     lastMessage: {
            //         id: 'msg3',
            //         chatId: 'group1',
            //         senderId: 'user3',
            //         content: 'Check out the new standalone components.',
            //         timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
            //         status: 'read'
            //     }
            // }
        ];
    }

    getCurrentUser(): User {
        return this.currentUser;
    }

    getChats(): Observable<Chat[]> {
        return this.chats$;
    }



    // fetch user list
    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${environment.apiUrl}/users/get-all-users`);
    }

    createOrOpenChat(user: User): void {
        const existingChat = this.mockChats.find(c =>
            !c.isGroup && c.participants.some(p => p.id === user.id)
        );

        if (existingChat) {
            this.setActiveChat(existingChat.id);
        } else {
            const newChat: Chat = {
                id: `chat_${Date.now()}`,
                participants: [this.currentUser, user],
                isGroup: false,
                unreadCount: 0
            };
            this.mockChats.unshift(newChat);
            this.chatsSubject.next([...this.mockChats]);
            this.setActiveChat(newChat.id);
        }

        // Establish socket connection for the current user 
        const currentUserId = Number(this.currentUser.id);
        this.establishSocketConnection(currentUserId);

        // Optional: Send the test message automatically after establishing the socket connection
        // Assuming the selected user is the receiver
        const receiverId = Number(user.id);
        // this.sendSocketMessage(currentUserId, receiverId, 'hi there');
    }

    private establishSocketConnection(userId: number) {
        if (!this.socket) {
            // Socket.IO normally uses the standard HTTP URL to connect
            this.socket = io(environment.socketUrl, {
                query: { userId: userId.toString() },
                transports: ['websocket', 'polling'] // Try websocket first, fallback to polling
            });

            this.socket.on('connect', () => {
                console.log(`Socket.IO connection established for user ${userId}`);
            });

            this.socket.on('message', (msg: any) => {
                this.handleIncomingSocketMessage(msg);
            });

            this.socket.on('connect_error', (err) => {
                console.error('Socket.IO Connection Error:', err);
            });

            this.socket.on('disconnect', () => {
                console.log('Socket.IO connection closed');
            });
        }
    }

    public sendSocketMessage(senderId: number, receiverId: number, content: string) {
        if (this.socket) {
            const payload = {
                senderId: senderId,
                recieverId: receiverId, // Using 'recieverId' as per your example format
                content: content
            };

            console.log('Sending message via Socket.IO', payload);

            // Emitting to a generic event 'sendMessage'. Adjust to match your backend exactly.
            this.socket.emit('sendMessage', payload);
        } else {
            console.warn('Cannot send message: Socket.IO connection is not active.');
        }
    }

    private handleIncomingSocketMessage(msg: any) {
        console.log('Received real-time message via socket:', msg);
        // Implement logic here to add the incoming message to your this.mockMessages state
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
