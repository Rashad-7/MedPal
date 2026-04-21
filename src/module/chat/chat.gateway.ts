// src/module/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { TokenService } from 'src/common/service/token.service';
import mongoose from 'mongoose';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map: userId => socketId
  private connectedUsers = new Map<string, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly tokenService: TokenService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.headers.authorization;
      if (!token) {
        throw new Error('No authorization token provided');
      }
      const user = await this.tokenService.verifyToken({ authorization: token });
      client.data.user = user;
      this.connectedUsers.set(user._id.toString(), client.id);
      console.log(`User ${user._id} connected via socket ${client.id}`);
    } catch (err) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.delete(user._id.toString());
      console.log(`User ${user._id} disconnected`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; message: string },
  ) {
    const sender = client.data.user;
    if (!sender) return;

    const receiverId = new mongoose.Types.ObjectId(data.receiverId);

    const savedMessage = await this.chatService.sendMessage(
      sender,
      receiverId,
      data.message,
    );

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newMessage', savedMessage);
    }

    client.emit('messageSent', savedMessage);

    return savedMessage;
  }

  @SubscribeMessage('getHistory')
  async handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { withUserId: string; page?: string; limit?: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const history = await this.chatService.getHistory(
      user._id,
      new mongoose.Types.ObjectId(data.withUserId),
      data.page,
      data.limit,
    );

    client.emit('chatHistory', history);
    return history;
  }
}