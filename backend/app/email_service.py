from fastapi import HTTPException
from typing import Optional
import logging
import smtplib
import uuid
import email.utils
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .config import settings

logger = logging.getLogger(__name__)

def _send_email_smtp(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """
    Internal function to send email using standard smtplib
    Works with both authenticated and unauthenticated SMTP servers
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg['To'] = to_email
        msg['Message-ID'] = f"<{uuid.uuid4()}@{settings.smtp_server}>"
        msg['Date'] = email.utils.formatdate(localtime=True)
        
        # Attach text and HTML parts
        part1 = MIMEText(text_body, 'plain', 'utf-8')
        part2 = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect to SMTP server
        logger.info(f"Connecting to SMTP server {settings.smtp_server}:{settings.smtp_port}")
        
        # Use SMTP_SSL for port 465 (SSL), SMTP + STARTTLS for other ports
        if settings.smtp_port == 465:
            logger.info("Using SMTP_SSL for port 465")
            server = smtplib.SMTP_SSL(settings.smtp_server, settings.smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(settings.smtp_server, settings.smtp_port, timeout=10)
            if settings.smtp_use_tls:
                logger.info("Starting TLS...")
                server.starttls()
        
        server.set_debuglevel(1)  # Enable debug output
        
        try:
            # Login if credentials provided
            if settings.smtp_username and settings.smtp_password:
                logger.info(f"Authenticating as {settings.smtp_username}")
                server.login(settings.smtp_username, settings.smtp_password)
            else:
                logger.info("No authentication (local SMTP server)")
            
            # Send email
            logger.info(f"Sending email to {to_email}")
            server.send_message(msg)
            logger.info(f"✅ Email sent successfully to {to_email}")
            
        finally:
            server.quit()
            
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


async def send_verification_email(email: str, verification_token: str) -> bool:
    """Send email verification link to user"""
    # Check if SMTP server is configured
    if not settings.smtp_server or not settings.smtp_username or not settings.smtp_password:
        logger.warning(f"SMTP server not fully configured (server: {settings.smtp_server}, username: {bool(settings.smtp_username)}, password: {bool(settings.smtp_password)}), skipping email to {email}")
        return False
        
    try:
        # Create verification URL
        verification_url = f"https://visionoftrading.com/auth/verify-email?token={verification_token}"
        
        # Email template
        subject = "Подтвердите ваш email - Vision of Trading"
        
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
                    <h1>📈 Vision of Trading</h1>
                    <p>Подтверждение регистрации</p>
                </div>
                
                <div class="content">
                    <h2>Добро пожаловать!</h2>
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
                    <p>(c) 2024 Vision of Trading. Все права защищены.</p>
                    <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Добро пожаловать в Vision of Trading!
        
        Спасибо за регистрацию. Для завершения процесса регистрации, пожалуйста, подтвердите ваш email адрес.
        
        Перейдите по ссылке: {verification_url}
        
        Ссылка действительна в течение 24 часов.
        
        (c) 2024 Vision of Trading. Все права защищены.
        """
        
        # Send email using standard SMTP
        return _send_email_smtp(email, subject, html_body, text_body)
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        return False

async def send_password_reset_email(email: str, reset_token: str) -> bool:
    """Send password reset link to user"""
    # Check if SMTP server is configured
    if not settings.smtp_server or not settings.smtp_username or not settings.smtp_password:
        logger.warning(f"SMTP server not fully configured (server: {settings.smtp_server}, username: {bool(settings.smtp_username)}, password: {bool(settings.smtp_password)}), skipping email to {email}")
        return False
        
    try:
        reset_url = f"https://visionoftrading.com/auth/reset-password?token={reset_token}"
        
        subject = "Сброс пароля - Vision of Trading"
        
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
                    <h1>📈 Vision of Trading</h1>
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
                    <p>(c) 2024 Vision of Trading. Все права защищены.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Запрос на сброс пароля - Vision of Trading
        
        Вы запросили сброс пароля для вашего аккаунта.
        
        Перейдите по ссылке: {reset_url}
        
        Ссылка действительна в течение 1 часа.
        
        Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        
        (c) 2024 Vision of Trading. Все права защищены.
        """
        
        # Send email using standard SMTP
        return _send_email_smtp(email, subject, html_body, text_body)
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        return False
