import { Types } from 'mongoose';

export interface IHealthReport {
  _id: Types.ObjectId;
  medications: string[]; 
  diagnosis: string;    
  note?: string;         
  lastUpdate: Date;      
}