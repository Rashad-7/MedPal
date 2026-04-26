// src/module/chat/chat.gateway.ts
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { TokenService } from 'src/common/service/token.service';
import { CallStatus } from 'src/DB/model/Chat.model';
import mongoose from 'mongoose';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: false },
  namespace: '/chat',
  transports: ['polling', 'websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId → socketId

  constructor(
    private readonly chatService: ChatService,
    private readonly tokenService: TokenService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader =
        client.handshake.headers.authorization ||
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);

      if (!authHeader) { client.disconnect(); return; }

      const user = await this.tokenService.verifyToken({ authorization: authHeader });
      client.data.user = user;
      this.connectedUsers.set(user._id.toString(), client.id);
      console.log(`✅ ${user._id} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.delete(user._id.toString());
      // لو كان في مكالمة، بلّغ الطرف التاني
      this.server.emit(`callEnded_${user._id}`, { reason: 'disconnected' });
    }
  }

  // ============ إرسال رسالة نص ============
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; message: string },
  ) {
    const sender = client.data.user;
    if (!sender) return;

    const saved = await this.chatService.sendMessage(
      sender,
      new mongoose.Types.ObjectId(data.receiverId),
      data.message,
    );

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newMessage', saved);
    }

    client.emit('messageSent', saved);
    return saved;
  }

  // ============ جلب التاريخ ============
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
  }

  // ============ WebRTC Signaling ============

  // 1. بدء مكالمة
  @SubscribeMessage('initiateCall')
  async handleInitiateCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    const caller = client.data.user;
    if (!caller) return;

    const call = await this.chatService.initiateCall(
      caller,
      new mongoose.Types.ObjectId(data.receiverId),
    );

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      // بلّغ المستقبل إن في مكالمة جاية
      this.server.to(receiverSocketId).emit('incomingCall', {
        callId: call._id,
        callerId: caller._id,
        callerName: caller.fullName,
      });
    }

    client.emit('callInitiated', { callId: call._id });
  }

  // 2. WebRTC Offer
  @SubscribeMessage('webrtcOffer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; offer: any; callId: string },
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('webrtcOffer', {
        offer: data.offer,
        callId: data.callId,
        senderId: client.data.user?._id,
      });
    }
  }

  // 3. WebRTC Answer
  @SubscribeMessage('webrtcAnswer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; answer: any; callId: string },
  ) {
    await this.chatService.updateCallStatus(data.callId, CallStatus.ACCEPTED);

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('webrtcAnswer', {
        answer: data.answer,
        callId: data.callId,
      });
    }
  }

  // 4. ICE Candidates
  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; candidate: any },
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('iceCandidate', {
        candidate: data.candidate,
      });
    }
  }

  // 5. رفض المكالمة
  @SubscribeMessage('rejectCall')
  async handleRejectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callerId: string; callId: string },
  ) {
    await this.chatService.updateCallStatus(data.callId, CallStatus.REJECTED);

    const callerSocketId = this.connectedUsers.get(data.callerId);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('callRejected', { callId: data.callId });
    }
  }

  // 6. إنهاء المكالمة
  @SubscribeMessage('endCall')
  async handleEndCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; callId: string; duration: number },
  ) {
    await this.chatService.updateCallStatus(
      data.callId,
      CallStatus.ENDED,
      data.duration,
    );

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('callEnded', {
        callId: data.callId,
        duration: data.duration,
      });
    }
  }
}