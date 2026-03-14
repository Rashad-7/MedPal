
export enum DiseaseStatus {
  STABLE = 'stable',
  CRITICAL = 'critical',
  UNDER_CONTROL = 'under control',
}

export interface IChronicDiseases {
  name: string;
  diagnosisDate: Date;
  medications?: string[];
  status: DiseaseStatus;
  notes?: string;
}

