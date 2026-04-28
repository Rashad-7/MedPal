// src/common/service/aiMedicine.service.ts
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';

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

  // ── الخطوة ١: ابعت الصورة وجيب اسم الدوا ──
  async getMedicineNameFromImage(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('Image is required');

    try {
      const FormData = require('form-data');
      const axios = require('axios');
      const fs = require('fs');

   const form = new FormData();

form.append('file', file.buffer, {
  filename: file.originalname,
  contentType: file.mimetype,
});

      const response = await axios.post(
        'https://backspace-anthology-spookily.ngrok-free.dev/predict',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'ngrok-skip-browser-warning': 'true', // مهم جداً مع ngrok
          },
          timeout: 60000,
        },
      );

      console.log('AI raw response:', response.data?.drug);

      const name =
        response.data?.drug_name ||
        response.data?.medicine_name ||
        response.data?.name ||
        response.data?.result ||
        response.data?.prediction;

      if (!name) {
        throw new BadRequestException('Could not detect medicine name from image');
      }

      return name as string;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      // console.error('AI endpoint error:', err?.response?.data || err.message);
      throw new InternalServerErrorException('AI service failed: ' + err.message);
    }
  }

  // ── الخطوة ٢: جيب تفاصيل الدوا بالاسم ──
  async getMedicineData(name: string): Promise<Partial<MedicineAIResult>> {
    try {
      const axios = require('axios');

      // بنستخدم FDA Open API مجاناً — مش محتاج API key
      const response = await axios.get('https://api.fda.gov/drug/label.json', {
        params: {
          search: `openfda.brand_name:"${name}"`,
          limit: 1,
        },
        timeout: 10000 ,
      });

      const result = response.data?.results?.[0];
      if (!result) return { tradName: name }; // لو مش لاقيه، رجّع الاسم بس

      return {
        tradName: result.openfda?.brand_name?.[0] || name,
        activeIngredient: result.active_ingredient?.[0]?.substring(0, 200) || '',
        genericName: result.openfda?.generic_name?.[0] || '',
        description: result.description?.[0]?.substring(0, 500) || '',
        sideEffects: result.adverse_reactions
          ? [result.adverse_reactions[0]?.substring(0, 300)]
          : [],
        contraindications: result.contraindications
          ? [result.contraindications[0]?.substring(0, 300)]
          : [],
        interactions: result.drug_interactions
          ? [result.drug_interactions[0]?.substring(0, 300)]
          : [],
        instructions: result.dosage_and_administration?.[0]?.substring(0, 300) || '',
      };
    } catch (err) {
      // لو FDA فشلت، منوقفش — نكمل بالاسم بس
      console.warn('FDA API failed, using name only:', err.message);
      return { tradName: name, sideEffects: [], contraindications: [], interactions: [] };
    }
  }
}