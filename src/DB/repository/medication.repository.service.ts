
import { Injectable } from '@nestjs/common';
import { DataBaseRepository } from './db.repository';
import { Medicine } from '../model/Medication.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class MedicationRepositoryService<TDocument> extends DataBaseRepository<TDocument> {
  constructor(
    @InjectModel(Medicine.name)
    private readonly medicineModel: Model<TDocument>,
  ) {
    super(medicineModel);
  }
}