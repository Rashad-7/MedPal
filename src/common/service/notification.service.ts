// src/common/service/notification.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService implements OnModuleInit {
  onModuleInit() {
    // لو Firebase مش initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async sendToDevice(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data: data || {},
        android: {
          priority: 'high',
          notification: { sound: 'default', channelId: 'medication_reminder' },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      });
      console.log(`✅ Notification sent to ${fcmToken}`);
    } catch (err) {
      console.error(`❌ FCM error:`, err.message);
    }
  }
}