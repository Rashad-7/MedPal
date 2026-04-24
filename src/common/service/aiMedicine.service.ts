// src/common/service/aiMedicine.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudService } from '../multer/cloud.service';

export interface MedicineAIResult {
  tradName: string;
  activeIngredient: string;
  genericName?: string;
  dosage?: string;
  frequency?: string;
  strength?: string;
  description?: string;
  instructions?: string;
  sideEffects: string[];
  contraindications: string[];
  interactions: string[];
  category?: string;
}

@Injectable()
export class AIMedicineService {
  constructor(private readonly cloudService: CloudService) {}

  async getMedicineData(
    name?: string,
    file?: Express.Multer.File,
  ): Promise<MedicineAIResult> {
    if (!name && !file) {
      throw new BadRequestException('يجب إرسال اسم الدوا أو صورته');
    }

    // ============================================
    // TODO: لما الموديل يتحمل على هوست، استبدل
    // الـ mock ده بـ API call زي كده:
    //
    // const formData = new FormData();
    // if (name) formData.append('medicine_name', name);
    // if (file) formData.append('image', file.buffer, file.originalname);
    //
    // const response = await fetch(process.env.AI_MODEL_URL, {
    //   method: 'POST',
    //   body: formData,
    // });
    // return await response.json();
    // ============================================

    // Placeholder حتى الموديل يتحمل
    return this.mockMedicineData(name || 'Unknown Medicine');
  }

  // ده هيتشال لما الموديل يتحمل
  private mockMedicineData(name: string): MedicineAIResult {
    return {
      tradName: name,
      activeIngredient: 'يجب ربط الموديل',
      genericName: 'يجب ربط الموديل',
      dosage: 'يجب ربط الموديل',
      frequency: 'يجب ربط الموديل',
      strength: 'يجب ربط الموديل',
      description: 'يجب ربط الموديل',
      instructions: 'يجب ربط الموديل',
      sideEffects: ['يجب ربط الموديل'],
      contraindications: ['يجب ربط الموديل'],
      interactions: ['يجب ربط الموديل'],
      category: 'يجب ربط الموديل',
    };
  }

  // ============================================
  // لما الموديل يتحمل، فضل الـ method دي جاهزة
  // ============================================
  async getMedicineFromImage(file: Express.Multer.File): Promise<string> {
    // الموديل يرجع اسم الدوا من الصورة
    // const response = await fetch(`${process.env.AI_MODEL_URL}/identify`, ...);
    // return response.json().medicine_name;
    return 'Unknown';
  }
}