from fastapi import HTTPException
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import Optional
import logging
from .config import settings

logger = logging.getLogger(__name__)

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.smtp_username,
    MAIL_PASSWORD=settings.smtp_password,
    MAIL_FROM=settings.smtp_from_email,
    MAIL_PORT=settings.smtp_port,
    MAIL_SERVER=settings.smtp_server,
    MAIL_FROM_NAME=settings.smtp_from_name,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

fastmail = FastMail(conf)

async def send_verification_email(email: str, verification_token: str) -> bool:
    """Send email verification link to user"""
    # Check if SMTP is configured
    if not settings.smtp_username or not settings.smtp_password:
        logger.warning(f"SMTP not configured, skipping email to {email}")
        return False
        
    try:
        # Create verification URL
        verification_url = f"http://144.124.233.176/auth/verify-email?token={verification_token}"
        
        # Email template
        subject = "Подтвердите ваш email - Trade Vision"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Подтверждение email</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #0a0e1a; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9f9f9; padding: 30px; }}
                .button {{ 
                    display: inline-block; 
                    background-color: #007bff; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;
                }}
                .footer {{ background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Trade Vision</h1>
                    <p>Подтверждение регистрации</p>
                </div>
                
                <div class="content">
                    <h2>Добро пожаловать в Trade Vision!</h2>
                    <p>Спасибо за регистрацию. Для завершения процесса регистрации, пожалуйста, подтвердите ваш email адрес.</p>
                    
                    <p>Нажмите на кнопку ниже для подтверждения:</p>
                    
                    <a href="{verification_url}" class="button">Подтвердить Email</a>
                    
                    <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
                    <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 3px;">
                        {verification_url}
                    </p>
                    
                    <p>Ссылка действительна в течение 24 часов.</p>
                </div>
                
                <div class="footer">
                    <p>© 2024 Trade Vision. Все права защищены.</p>
                    <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Добро пожаловать в Trade Vision!
        
        Спасибо за регистрацию. Для завершения процесса регистрации, пожалуйста, подтвердите ваш email адрес.
        
        Перейдите по ссылке: {verification_url}
        
        Ссылка действительна в течение 24 часов.
        
        © 2024 Trade Vision. Все права защищены.
        """
        
        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=text_body,
            subtype="plain"
        )
        
        # Send email
        await fastmail.send_message(message)
        logger.info(f"Verification email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        return False

async def send_password_reset_email(email: str, reset_token: str) -> bool:
    """Send password reset link to user"""
    # Check if SMTP is configured
    if not settings.smtp_username or not settings.smtp_password:
        logger.warning(f"SMTP not configured, skipping email to {email}")
        return False
        
    try:
        reset_url = f"http://144.124.233.176/auth/reset-password?token={reset_token}"
        
        subject = "Сброс пароля - Trade Vision"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Сброс пароля</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #0a0e1a; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9f9f9; padding: 30px; }}
                .button {{ 
                    display: inline-block; 
                    background-color: #dc3545; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;
                }}
                .footer {{ background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Trade Vision</h1>
                    <p>Сброс пароля</p>
                </div>
                
                <div class="content">
                    <h2>Запрос на сброс пароля</h2>
                    <p>Вы запросили сброс пароля для вашего аккаунта.</p>
                    
                    <p>Нажмите на кнопку ниже для создания нового пароля:</p>
                    
                    <a href="{reset_url}" class="button">Сбросить пароль</a>
                    
                    <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
                    <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 3px;">
                        {reset_url}
                    </p>
                    
                    <p>Ссылка действительна в течение 1 часа.</p>
                    <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
                </div>
                
                <div class="footer">
                    <p>© 2024 Trade Vision. Все права защищены.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Запрос на сброс пароля - Trade Vision
        
        Вы запросили сброс пароля для вашего аккаунта.
        
        Перейдите по ссылке: {reset_url}
        
        Ссылка действительна в течение 1 часа.
        
        Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        
        © 2024 Trade Vision. Все права защищены.
        """
        
        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=text_body,
            subtype="plain"
        )
        
        await fastmail.send_message(message)
        logger.info(f"Password reset email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        return False
