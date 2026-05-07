// src/common/service/chatbot.service.ts
import { ChatSessionDocument, ChatSessionModel } from './../../DB/model/ChatSession.model';
import { Injectable, NotFoundException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';
import { UserDocument } from 'src/DB/model/User.model';
import { ChatSessionRepositoryService } from 'src/DB/repository/chatSession.repository.service';

@Injectable()
export class ChatBotService {
  private groq: Groq;

  constructor(
    private readonly patientRepository: PatientRepositoryService<PatientDocument>,
    private readonly chatSessionRepository: ChatSessionRepositoryService<ChatSessionDocument>,
  ) {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  

 async chat(user: UserDocument, message: string){
        let session = await this.chatSessionRepository.findOne({filter:{ userId: user._id }});
  if (!session) {
    session = await this.chatSessionRepository.create({ userId: user._id, history: [] });
  }
    const recentHistory = session.history.slice(-10).map((h) => ({
    role: h.role,
    content: h.content,
  }));

    // 1. جيب بيانات المريض كاملة من الداتا بيز
    const patient = await this.patientRepository.findOne({
      filter: { userId: user._id },
    });

    if (!patient) throw new NotFoundException('Patient profile not found');

    // 2. جهز context الأدوية مع الأعراض الجانبية
    const medicationsContext = patient.medications?.map((m) => ({
      name: m.medicationName,
      dosage: m.dosage,
      sideEffects: m.sideEffects || [],
      warningLevel: m.warningLevel,
      active: m.active,
    })) || [];

    // 3. جهز context الأمراض المزمنة
    const diseasesContext = patient.chronicDiseases?.map((d) => ({
      name: d.name,
      status: d.status,
      medications: d.medications || [],
    })) || [];

    // 4. ابني الـ system prompt بالبيانات الحقيقية
    const systemPrompt = `You are a medical assistant chatbot for a healthcare app. You have access to the patient's real medical data from the database.

PATIENT PROFILE:
- Blood Type: ${patient.bloodType || 'Unknown'}
- Height: ${patient.height || 'Unknown'} cm
- Weight: ${patient.weight || 'Unknown'} kg
- Allergies: ${patient.allergies || 'None'}

CURRENT ACTIVE MEDICATIONS:
${medicationsContext.length > 0
  ? medicationsContext
      .filter((m) => m.active)
      .map(
        (m, i) =>
          `${i + 1}. ${m.name} (${m.dosage}) - Warning: ${m.warningLevel}
   Side Effects: ${m.sideEffects.length > 0 ? m.sideEffects.join(', ') : 'None listed'}`,
      )
      .join('\n')
  : 'No active medications'}

CHRONIC DISEASES:
${diseasesContext.length > 0
  ? diseasesContext
      .map((d, i) => `${i + 1}. ${d.name} (${d.status})`)
      .join('\n')
  : 'None'}

YOUR ROLE:
- Answer the patient's health questions using their real data above
- If they describe a symptom, check if it matches any side effect of their current medications and tell them
- If they ask about a medication, give detailed info from their profile
- Always recommend consulting their doctor for serious concerns
- Be friendly, clear, and speak in the same language the patient uses
- NEVER make up medications or symptoms not in the database

IMPORTANT: If the patient asks about a symptom and it matches a side effect of one of their medications, clearly say: "This symptom could be a side effect of [medication name]"`;

    // 5. ابني conversation history
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message },
    ];

    // 6. بعت لـ Groq
    const response = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    });

    const reply = response.choices[0].message.content || 'Sorry, I could not generate a response.';
  session.history.push(
    { role: 'user', content: message, createdAt: new Date() },
    { role: 'assistant', content: reply, createdAt: new Date() },
  );
  await session.save();
    return {
      message: 'done',
      reply,
      context: {
        medicationsChecked: medicationsContext.filter((m) => m.active).length,
        diseasesChecked: diseasesContext.length,
      },
    };
  }
  // service
async getChatHistory(user: UserDocument) {
  const session = await this.chatSessionRepository.findOne({
    filter: { userId: user._id },
  });

  if (!session) {
    return {
      message: 'No chat history found',
      totalMessages: 0,
      data: [],
    };
  }

  return {
    message: 'done',
    totalMessages: session.history.length,
    data: session.history.sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    ),
  };
}
}