
import { Injectable } from '@nestjs/common';
import { DataBaseRepository } from './db.repository';
import { SOS } from '../model/SOS.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SOSRepositoryService<TDocument> extends DataBaseRepository<TDocument> {
  constructor(
    @InjectModel(SOS.name)
    private readonly sosModel: Model<TDocument>,
  ) {
    super(sosModel);
  }
}