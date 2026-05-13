import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import Groq from 'groq-sdk';

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
  interactions: any[];
  summary: string;
}

export interface ChronicDiseaseCompatibilityResult {
  isCompatible: boolean;
  warningLevel: 'safe' | 'caution' | 'avoid';
  details: any[];
  summary: string;
  doctorConsultRequired: boolean;
}

@Injectable()
export class AIMedicineGroqService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });
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
    const url = process.env.AI_MODEL_URL;
if (!url) throw new Error('AI_MODEL_URL missing');
    const response = await axios({
  method: 'POST',
  url,
  data: form,
  headers: {
    ...form.getHeaders(),
    'ngrok-skip-browser-warning': 'true',
  },
  maxBodyLength: Infinity,
  timeout: 15000,
});

    let name =
      response.data?.drug_name ||
      response.data?.drug ||
      response.data?.medicine_name ||
      response.data?.name ||
      response.data?.result ||
      response.data?.prediction;

    if (!name) throw new Error('Image model failed');

    name = String(name).trim();

    
    
    
    const cleaned = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content:
            'You normalize medicine names. Return ONLY the correct official drug name. No explanation.',
        },
        {
          role: 'user',
          content: `Fix and standardize this medicine name: ${name}`,
        },
      ],
      temperature: 0.1,
    });

    const finalName = cleaned.choices[0].message.content
      ?.replace(/```/g, '')
      .trim();

    return finalName || name;
  } catch (err) {
    throw new InternalServerErrorException(
      'AI model failed: ' + err.message,
    );
  }
}
  
  
  
  private async callGroq(prompt: string) {
    const res = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content:
            'You are a clinical medical AI. Return ONLY valid JSON. No markdown.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    });

    const text = res.choices[0].message.content || '';

    return JSON.parse(
      text.replace(/```json/gi, '').replace(/```/g, '').trim(),
    );
  }

  
  
  
  async getMedicineData(name: string): Promise<MedicineAIResult> {
    try {
      const prompt = `
Return medicine info for: "${name}"

Return ONLY JSON:
{
  "medicationName": "",
  "activeIngredient": "",
  "genericName": "",
  "dosage": "",
  "frequency": "",
  "strength": "",
  "description": "",
  "instructions": "",
  "sideEffects": [],
  "contraindications": [],
  "interactions": [],
  "category": "",
  "warningLevel": "safe"
}
`;

      const parsed = await this.callGroq(prompt);

      return {
        medicationName: parsed.medicationName || name,
        activeIngredient: parsed.activeIngredient || 'N/A',
        genericName: parsed.genericName,
        dosage: parsed.dosage,
        frequency: parsed.frequency,
        strength: parsed.strength,
        description: parsed.description,
        instructions: parsed.instructions,
        sideEffects: parsed.sideEffects || [],
        contraindications: parsed.contraindications || [],
        interactions: parsed.interactions || [],
        category: parsed.category,
        warningLevel: parsed.warningLevel || 'safe',
      };
    } catch (err) {
      throw new InternalServerErrorException('Groq failed: ' + err.message);
    }
  }

  
  
  
  async checkDrugInteractions(
    newDrug: string,
    currentMedications: string[],
  ): Promise<DrugInteractionResult> {
    if (!currentMedications?.length) {
      return {
        hasInteraction: false,
        severity: 'none',
        interactions: [],
        summary: 'No current medications.',
      };
    }

    const prompt = `
Check drug interactions.

New drug: ${newDrug}
Current meds: ${currentMedications.join(', ')}

Return JSON:
{
  "hasInteraction": false,
  "severity": "none",
  "interactions": [],
  "summary": ""
}
`;

    try {
      return await this.callGroq(prompt);
    } catch {
      throw new InternalServerErrorException('Interaction check failed');
    }
  }

  
  
  
  async checkChronicDiseaseCompatibility(
    drugName: string,
    diseases: any[],
  ): Promise<ChronicDiseaseCompatibilityResult> {
    if (!diseases?.length) {
      return {
        isCompatible: true,
        warningLevel: 'safe',
        details: [],
        summary: 'No diseases.',
        doctorConsultRequired: false,
      };
    }

    const prompt = `
Check compatibility.

Drug: ${drugName}
Diseases: ${JSON.stringify(diseases)}

Return JSON:
{
  "isCompatible": true,
  "warningLevel": "safe",
  "details": [],
  "summary": "",
  "doctorConsultRequired": false
}
`;

    try {
      return await this.callGroq(prompt);
    } catch {
      throw new InternalServerErrorException('Compatibility check failed');
    }
  }
}