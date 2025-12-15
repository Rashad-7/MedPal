
export interface IChronicDiseases {
  name: string;
  diagnosisDate: Date;
  medications?: string[];
  status: 'stable' | 'critical' | 'under control';
  notes?: string;
}

