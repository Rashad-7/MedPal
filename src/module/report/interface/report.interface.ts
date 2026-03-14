export interface IHealthReport {
  medications: string[]; 
  diagnosis: string;    
  note?: string;         
  lastUpdate: Date;      
}