import { Injectable } from "@nestjs/common";
import { DataBaseRepository } from "./db.repository";
import { Patient } from "../model/patient.model";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class PatientRepositoryService<TDocument> extends DataBaseRepository<TDocument> {
  constructor(
    @InjectModel(Patient.name)
    private readonly patientModel: Model<TDocument>,
  ) {
    super(patientModel);
  }
}
