
import { Injectable } from "@nestjs/common";
import { DataBaseRepository } from "./db.repository";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Doctor } from "../model/doctor.model";

@Injectable()
export class DoctorRepositoryService<TDocument> extends DataBaseRepository<TDocument> {
  constructor(
    @InjectModel(Doctor.name)
    private readonly DoctorModel: Model<TDocument>,
  ) {
    super(DoctorModel);
  }
}
