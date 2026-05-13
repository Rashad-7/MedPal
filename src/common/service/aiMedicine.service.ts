
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface MedicineAIResult {
  medicationName: string;
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
  warningLevel: string;
}

export interface DrugInteractionResult {
  hasInteraction: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  interactions: {
    drug1: string;
    drug2: string;
    effect: string;
    severity: string;
    recommendation: string;
  }[];
  summary: string;
}

export interface ChronicDiseaseCompatibilityResult {
  isCompatible: boolean;
  warningLevel: 'safe' | 'caution' | 'avoid';
  details: {
    disease: string;
    compatible: boolean;
    reason: string;
    recommendation: string;
  }[];
  summary: string;
  doctorConsultRequired: boolean;
}

@Injectable()
export class AIMedicineService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  

  
  async getMedicineNameFromImage(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('Image is required');

    try {
      const FormData = require('form-data');
      const axios = require('axios');

      const form = new FormData();
      form.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await axios.post(
        process.env.AI_MODEL_URL || 'https://backspace-anthology-spookily.ngrok-free.dev/predict',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 60000,
        },
      );

      console.log('AI Model response:', response.data);

      const name =
        response.data?.drug_name ||
        response.data?.drug ||
        response.data?.medicine_name ||
        response.data?.name ||
        response.data?.result ||
        response.data?.prediction;

      if (!name) throw new BadRequestException('Could not detect medicine name from image');

      return String(name).trim();
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('AI model failed: ' + err.message);
    }
  }

  
  
  
  async getMedicineData(
    name?: string,
    file?: Express.Multer.File,
  ): Promise<MedicineAIResult> {
    if (!name && !file) {
      throw new BadRequestException('Either medicine name or image is required');
    }

    
    let medicineName = name;
    if (file) {
      medicineName = await this.getMedicineNameFromImage(file);
      console.log(`✅ Medicine detected from image: ${medicineName}`);
    }

    return await this.getFromGemini(medicineName!);
  }

  

  
  async checkDrugInteractions(
    newDrug: string,
    currentMedications: string[] 
  ): Promise<DrugInteractionResult> {
    if (!currentMedications || currentMedications.length === 0) {
      return {
        hasInteraction: false,
        severity: 'none',
        interactions: [],
        summary: 'No current medications to check interactions with.',
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are a clinical pharmacist. Check for drug interactions between the new drug and the patient's current medications.

New drug: "${newDrug}"
Current medications: ${currentMedications.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Return ONLY a valid JSON object. No markdown, no backticks, raw JSON only.

{
  "hasInteraction": true or false,
  "severity": "none" or "mild" or "moderate" or "severe",
  "interactions": [
    {
      "drug1": "new drug name",
      "drug2": "interacting drug name",
      "effect": "what happens when combined",
      "severity": "mild or moderate or severe",
      "recommendation": "what the patient should do"
    }
  ],
  "summary": "brief overall summary in simple language"
}

If no interactions found, return hasInteraction: false, empty interactions array, severity: "none".
Be clinically accurate and concise.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(text);

      return {
        hasInteraction: parsed.hasInteraction || false,
        severity: parsed.severity || 'none',
        interactions: Array.isArray(parsed.interactions) ? parsed.interactions : [],
        summary: parsed.summary || 'No significant interactions found.',
      };
    } catch (err) {
      console.error('Gemini interaction check failed:', err.message);
      throw new InternalServerErrorException('Failed to check drug interactions');
    }
  }

  

  
  async checkChronicDiseaseCompatibility(
    drugName: string,
    chronicDiseases: { name: string; status: string; medications?: string[] }[],
  ): Promise<ChronicDiseaseCompatibilityResult> {
    if (!chronicDiseases || chronicDiseases.length === 0) {
      return {
        isCompatible: true,
        warningLevel: 'safe',
        details: [],
        summary: 'No chronic diseases to check compatibility with.',
        doctorConsultRequired: false,
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const diseasesText = chronicDiseases
        .map((d, i) => `${i + 1}. ${d.name} (status: ${d.status})`)
        .join('\n');

      const prompt = `You are a clinical pharmacist. Check if the drug is safe for a patient with the following chronic diseases.

Drug: "${drugName}"
Patient's chronic diseases:
${diseasesText}

Return ONLY a valid JSON object. No markdown, no backticks, raw JSON only.

{
  "isCompatible": true or false,
  "warningLevel": "safe" or "caution" or "avoid",
  "details": [
    {
      "disease": "disease name",
      "compatible": true or false,
      "reason": "why it is or isn't compatible",
      "recommendation": "specific advice for this disease"
    }
  ],
  "summary": "overall summary in simple language",
  "doctorConsultRequired": true or false
}

warningLevel:
- "safe": drug is generally safe for all listed conditions
- "caution": drug can be used but with monitoring or dose adjustment
- "avoid": drug should be avoided due to one or more conditions

Be clinically accurate. Focus on real contraindications and precautions.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(text);

      return {
        isCompatible: parsed.isCompatible ?? true,
        warningLevel: ['safe', 'caution', 'avoid'].includes(parsed.warningLevel)
          ? parsed.warningLevel
          : 'safe',
        details: Array.isArray(parsed.details) ? parsed.details : [],
        summary: parsed.summary || '',
        doctorConsultRequired: parsed.doctorConsultRequired || false,
      };
    } catch (err) {
      console.error('Gemini compatibility check failed:', err.message);
      throw new InternalServerErrorException('Failed to check disease compatibility');
    }
  }

  
  
  
  private async getFromGemini(name: string): Promise<MedicineAIResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are a medical information assistant. Provide detailed information about the medicine: "${name}".

Return ONLY a valid JSON object. No markdown, no backticks, no explanation. Raw JSON only.

{
  "medicationName": "brand name",
  "activeIngredient": "active ingredient",
  "genericName": "generic name",
  "dosage": "typical dosage e.g. 500mg",
  "frequency": "how often e.g. every 8 hours",
  "strength": "available strengths e.g. 250mg, 500mg",
  "description": "what this medicine treats",
  "instructions": "how to take it",
  "sideEffects": ["side effect 1", "side effect 2", "side effect 3"],
  "contraindications": ["contraindication 1", "contraindication 2"],
  "interactions": ["drug interaction 1", "drug interaction 2"],
  "category": "drug category e.g. Antibiotic, Analgesic",
  "warningLevel": "safe"
}

warningLevel must be one of: safe, mild, moderate, severe`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(text);

      return {
        medicationName: parsed.medicationName || name,
        activeIngredient: parsed.activeIngredient || 'N/A',
        genericName: parsed.genericName,
        dosage: parsed.dosage,
        frequency: parsed.frequency,
        strength: parsed.strength,
        description: parsed.description,
        instructions: parsed.instructions,
        sideEffects: Array.isArray(parsed.sideEffects) ? parsed.sideEffects : [],
        contraindications: Array.isArray(parsed.contraindications) ? parsed.contraindications : [],
        interactions: Array.isArray(parsed.interactions) ? parsed.interactions : [],
        category: parsed.category,
        warningLevel: ['safe', 'mild', 'moderate', 'severe'].includes(parsed.warningLevel)
          ? parsed.warningLevel
          : 'safe',
      };
    } catch (err) {
      console.error('Gemini failed:', err.message);
      return {
        medicationName: name,
        activeIngredient: 'N/A',
        sideEffects: [],
        contraindications: [],
        interactions: [],
        warningLevel: 'safe',
      };
    }
  }
}