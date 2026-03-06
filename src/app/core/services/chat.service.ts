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
    userRooms: any = [];
    roomMessages: any = [];

    private readonly defaultUser: User = {
        id: 'user1',
        name: 'You',
        avatarUrl: 'https://i.pravatar.cc/150?u=user1',
    };

    private currentUser: any;
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
    public activeChat$: any = this.activeChatSubject.asObservable();

    public messagesSubject = new BehaviorSubject<Message[]>([]);
    public messages$ = this.messagesSubject.asObservable();

    // Socket.io connection instance
    private socket: Socket | null = null;

    constructor(private authService: AuthService, private http: HttpClient) {
        this.chatsSubject = new BehaviorSubject<Chat[]>(this.userRooms);
        this.chats$ = this.chatsSubject.asObservable();

        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.currentUser = user;
                this.loadHistoryChats();
                // Establish socket connection as soon as the user logs in
                // so the receiver always hears incoming messages
                this.establishSocketConnection(user.id);
            } else {
                this.clearState();
            }
        });
    }

    private clearState() {
        this.currentUser = this.defaultUser;
        this.userRooms = [];
        this.roomMessages = [];

        if (this.chatsSubject) {
            this.chatsSubject.next([...this.userRooms]);
        }
        if (this.activeChatSubject) {
            this.activeChatSubject.next(null);
        }
        if (this.messagesSubject) {
            this.messagesSubject.next([]);
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    private loadHistoryChats(): void {
        this.userRooms = [];
        this.getUserRooms().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.userRooms = res?.data;
                    this.chatsSubject.next([...this.userRooms]);
                    const chat: any = localStorage.getItem('activeChat');
                    const activeChat = JSON.parse(chat);
                    if (activeChat) {
                        this.createOrOpenChat(activeChat);
                    }
                }
                console.log(this.userRooms, 'user rooms list');

            },
            error: (err) => {
                console.log(err, ' error while fetching user rooms list');
            }
        });
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

    getUserRooms(): Observable<User[]> {
        return this.http.get<User[]>(`${environment.apiUrl}/rooms/used`);
    }

    getChatMessages(id: any): Observable<User[]> {
        return this.http.get<User[]>(`${environment.apiUrl}/messages/${id}`);
    }

    createOrOpenChat(user: User): void {
        const existingChatIndex = this.userRooms.findIndex((c: { id: string; }) => c.id === user.id);
        if (existingChatIndex > -1) {
            this.setActiveChat(user.id);
        } else {
            const newChat: any = {
                id: user.id,
                name: user.name,
                bio: '',
            };
            this.userRooms.unshift(newChat);
            this.chatsSubject.next([...this.userRooms]);
            this.setActiveChat(newChat.id);
        }

        // Establish socket connection for the current user 
        const currentUserId = this.currentUser.id;
        this.establishSocketConnection(currentUserId);

        // Optional: Send the test message automatically after establishing the socket connection
        // Assuming the selected user is the receiver
        const receiverId = Number(user.id);
        // this.sendSocketMessage(currentUserId, receiverId, 'hi there');
    }

    private establishSocketConnection(userId: string | number) {
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

            this.socket.on('newRoom', (res: any) => {
                this.newRoomCreated(res);
            });

            this.socket.on('connect_error', (err) => {
                console.error('Socket.IO Connection Error:', err);
            });

            this.socket.on('disconnect', () => {
                console.log('Socket.IO connection closed');
            });
        }
    }

    public sendSocketMessage(senderId: string | number, receiverId: string | number, content: string) {
        if (this.socket) {
            const payload = {
                senderId: senderId,
                receiverId: receiverId, // Fixed typo
                content: content
            };

            console.log('Sending message via Socket.IO', payload);

            // Emitting to a generic event 'sendMessage'. Adjust to match your backend exactly.
            this.socket.emit('sendMessage', payload);
        } else {
            console.warn('Cannot send message: Socket.IO connection is not active.');
        }
    }

    private newRoomCreated(res: any) {
        const existingChatIndex = this.userRooms.findIndex((c: { id: string; roomid: any }) => c.id === res.id);
        if (existingChatIndex > -1) {
            const chat = this.userRooms[existingChatIndex];
            chat.roomid = res.roomid;
            localStorage.setItem('activeChat', JSON.stringify(chat));
            this.activeChatSubject.next(chat);
        }
    }

    private handleIncomingSocketMessage(msg: any) {
        console.log('Received real-time message via socket:', msg);

        const senderId = msg.senderId || msg.userid;
        if (!senderId) return;

        // Try to find the chat containing this sender as a participant
        const existingChatIndex = this.userRooms.findIndex((c: { id: string; roomid: any }) => c.id === senderId);
        const existingChat = this.userRooms[existingChatIndex];
        let chatId;

        if (existingChatIndex > -1) {
            chatId = this.userRooms[existingChatIndex].id;
        } else {
            // New chat from a previously unknown sender — refresh from server
            chatId = senderId;
            this.loadHistoryChats();
        }

        // Map the message payload to the Message model
        const newMessage: any = {
            id: msg.id,
            content: msg.content,
            userid: msg.userid,
            roomid: msg.roomid,
            created_at: msg.created_at,
        };

        // if (!this.mockMessages[chatId]) {
        //     this.mockMessages[chatId] = [];
        // }

        // Prevent duplicate appending if sender ID is current user
        if (senderId.toString() !== this.currentUser.id.toString()) {
            this.roomMessages.push(newMessage);
        }

        // Update the last message
        existingChat.lastMessage = newMessage;

        // Move chat to top and handle unread count
        const chatIndex = this.userRooms.findIndex((c: { id: any; }) => c.id === chatId);
        if (chatIndex > -1) {
            const chatToMove = this.userRooms.splice(chatIndex, 1)[0];

            // Only increment unread count if we are not actively viewing this chat
            // if (this.activeChatSubject.value?.id !== chatId) {
            //     chatToMove.unreadCount = (chatToMove.unreadCount || 0) + 1;
            // }

            this.userRooms.unshift(chatToMove);
            this.chatsSubject.next([...this.userRooms]);
        }

        // Update active messages view if the user is looking at this chat
        if (this.activeChatSubject.value?.id === chatId) {
            this.messagesSubject.next([...this.roomMessages]);
        }
    }

    setActiveChat(chatId: string) {
        const chat: any = this.userRooms.find((c: { id: string; }) => c.id === chatId) || null;
        this.activeChatSubject.next(chat);
        localStorage.setItem('activeChat', JSON.stringify(chat));

        // Load messages for this chat
        // if (chatId && this.mockMessages[chatId]) {
        //     this.messagesSubject.next(this.mockMessages[chatId]);
        // } else {
        //     this.messagesSubject.next([]);
        // }

        if (chat) {
            // chat.unreadCount = 0;
            this.chatsSubject.next([...this.userRooms]);
        }
    }

    sendMessage(chatId: any, content: string) {
        const newMessage: any = {
            id: Date.now().toString(),
            roomid: 'newRoom',
            userid: this.currentUser.id,
            content,
            created_at: new Date(),
        };

        // if (!this.mockMessages[chatId]) {
        //     this.mockMessages[chatId] = [];
        // }

        this.roomMessages.push(newMessage);

        // Update last message in chat list
        const chatIndex = this.userRooms.findIndex((c: { id: string; roomid: any }) => c.id === chatId);
        if (chatIndex > -1) {
            this.userRooms[chatIndex].lastMessage = newMessage;
            // Move chat to top
            const chat = this.userRooms.splice(chatIndex, 1)[0];
            this.userRooms.unshift(chat);
            this.chatsSubject.next([...this.userRooms]);
        }

        // Update messages view if it's the active chat
        if (this.activeChatSubject.value?.id === chatId) {
            this.messagesSubject.next([...this.roomMessages]);
        }

        // --- Execute real socket emit ---
        // const activeChat: any = this.userRooms.find((c: { id: any; }) => c.id === chatId);
        // const receiver = activeChat?.participants.find(p => p.id !== this.currentUser.id);

        // if (receiver) {
        const senderId = this.currentUser.id;
        const receiverId = chatId;

        // Ensure socket is connected before sending
        this.establishSocketConnection(senderId);

        this.sendSocketMessage(senderId, receiverId, content);
        // }
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
