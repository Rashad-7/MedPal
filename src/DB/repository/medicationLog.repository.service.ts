// src/DB/repository/medicationLog.repository.service.ts
import { Injectable } from '@nestjs/common';
import { DataBaseRepository } from './db.repository';
import { MedicationLog } from '../model/MedicationLog.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class MedicationLogRepositoryService<TDocument> extends DataBaseRepository<TDocument> {
  constructor(
    @InjectModel(MedicationLog.name)
    private readonly logModel: Model<TDocument>,
  ) {
    super(logModel);
  }
}