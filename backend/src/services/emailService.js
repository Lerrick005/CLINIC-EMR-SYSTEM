const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // For development, use ethereal.email (fake SMTP)
    // For production, use SendGrid, Mailgun, or SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'test@ethereal.email',
        pass: process.env.SMTP_PASS || 'test123'
      }
    });
  }

  async sendPasswordReset(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"CLINIC EMR" <${process.env.SMTP_FROM || 'noreply@clinicemr.com'}>`,
      to: email,
      subject: 'Reset Your Password - CLINIC EMR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #FFD700;">
            <h1 style="color: #1A1A1A;">🏥 CLINIC EMR</h1>
          </div>
          
          <div style="padding: 20px 0;">
            <h2 style="color: #1A1A1A;">Reset Your Password</h2>
            <p style="color: #4B5563; line-height: 1.6;">
              You requested to reset your password. Click the button below to set a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #FFD700 0%, #CFAF00 100%); color: #1A1A1A; text-decoration: none; border-radius: 40px; font-weight: 600;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6B6B6B; font-size: 14px;">
              This link will expire in 1 hour.
            </p>
            
            <p style="color: #6B6B6B; font-size: 14px; margin-top: 20px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9CA3AF; font-size: 12px;">
            <p>CLINIC EMR - Secure Healthcare Platform</p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: `"CLINIC EMR" <${process.env.SMTP_FROM || 'noreply@clinicemr.com'}>`,
      to: email,
      subject: 'Welcome to CLINIC EMR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #FFD700;">
            <h1 style="color: #1A1A1A;">🏥 CLINIC EMR</h1>
          </div>
          
          <div style="padding: 20px 0;">
            <h2 style="color: #1A1A1A;">Welcome, ${name || 'Doctor'}! 🎉</h2>
            <p style="color: #4B5563; line-height: 1.6;">
              Your clinic has been successfully registered on CLINIC EMR.
            </p>
            <p style="color: #4B5563; line-height: 1.6;">
              You can now log in and start managing your patients.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #FFD700 0%, #CFAF00 100%); color: #1A1A1A; text-decoration: none; border-radius: 40px; font-weight: 600;">
                Go to Login
              </a>
            </div>
          </div>
          
          <div style="padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9CA3AF; font-size: 12px;">
            <p>CLINIC EMR - Secure Healthcare Platform</p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;