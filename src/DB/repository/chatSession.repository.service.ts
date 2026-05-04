// src/DB/repository/chatSession.repository.service.ts
import { Injectable } from '@nestjs/common';
import { DataBaseRepository } from './db.repository';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ChatSession } from '@google/generative-ai';

@Injectable()
export class ChatSessionRepositoryService<TDocument> extends DataBaseRepository<TDocument> {
  constructor(
    @InjectModel(ChatSession.name)
    private readonly ChatSessionModel: Model<TDocument>,
  ) {
    super(ChatSessionModel);
  }
}