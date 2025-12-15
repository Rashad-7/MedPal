import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer'
export const sendEmail= async(data: SendMailOptions)=>{
    try {
        if (!data.to&&!data.cc&&data.bcc) {
            throw new BadRequestException('Missing Email Destination');
        }
         if (!data.text&&!data.html&&data.attachments?.length) {
            throw new BadRequestException('Missing Email Content');
        }
        const transporter:Transporter = createTransport({
            host: 'smtp.gmail.com',
            service: 'gmail',
            port: 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const info= await transporter.sendMail({
            from: `${process.env.EMAIL_USER}`,
            ...data
        });
    } catch (error) {
        throw new InternalServerErrorException('Error sending email:', error);
    }
};