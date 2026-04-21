// src/DB/repository/chat.repository.service.ts
import { Injectable } from '@nestjs/common';
import { DataBaseRepository } from './db.repository';
import { Chat } from '../model/Chat.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ChatRepositoryService<TDocument> extends DataBaseRepository<TDocument> {
  constructor(
    @InjectModel(Chat.name)
    private readonly chatModel: Model<TDocument>,
  ) {
    super(chatModel);
  }
}