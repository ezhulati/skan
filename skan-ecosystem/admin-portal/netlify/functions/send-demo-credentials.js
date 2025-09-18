const nodemailer = require('nodemailer');

// Email templates
const userEmailTemplate = (firstName, lastName, businessName) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kredencialet e Demo-s - Skan.al</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e2e8f0; }
        .credential-item { margin: 10px 0; }
        .credential-label { font-weight: bold; color: #4a5568; }
        .credential-value { background: #f7fafc; padding: 8px 12px; border-radius: 4px; font-family: monospace; margin-top: 5px; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Mirë se vini në Skan.al!</h1>
            <p>Kredencialet tuaja të demo-s janë gati</p>
        </div>
        
        <div class="content">
            <h2>Përshëndetje ${firstName} ${lastName}!</h2>
            
            <p>Faleminderit që treguat interes për platformën tonë <strong>Skan.al</strong>! Jemi të gëzuar që doni të testoni sistemin tonë të porositjeve QR për <strong>${businessName}</strong>.</p>
            
            <div class="credentials">
                <h3>🔑 Kredencialet tuaja të Demo-s:</h3>
                
                <div class="credential-item">
                    <div class="credential-label">Email/Username:</div>
                    <div class="credential-value">manager_email1@gmail.com</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">Fjalëkalimi:</div>
                    <div class="credential-value">demo123</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">Link i Panelit Admin:</div>
                    <div class="credential-value">https://admin.skan.al/login</div>
                </div>
            </div>
            
            <p><strong>Si të filloni:</strong></p>
            <ol>
                <li>Shkoni në <a href="https://admin.skan.al/login">admin.skan.al/login</a></li>
                <li>Futni kredencialet e mësipërme</li>
                <li>Eksploroni dashboard-in dhe funksionalitetet</li>
                <li>Testoni QR menu dhe sistemin e porositjeve</li>
            </ol>
            
            <a href="https://admin.skan.al/login" class="cta-button">Filloni Demo-n Tani →</a>
            
            <p><strong>Çfarë mund të testoni:</strong></p>
            <ul>
                <li>✅ Menaxhimi i menu-ve dhe kategorive</li>
                <li>✅ Gjenerimi i QR kodeve për tavolina</li>
                <li>✅ Dashboard real-time për porositë</li>
                <li>✅ Menaxhimi i përdoruesve dhe stafit</li>
                <li>✅ Raportet dhe analitikat</li>
            </ul>
            
            <p>Nëse keni pyetje apo keni nevojë për ndihmë, mos hezitoni të na kontaktoni!</p>
            
            <div class="footer">
                <p>Skan.al - Sistemi Modern i Porositjeve QR për Restorante</p>
                <p>📧 Email: info@skan.al | 🌐 Web: <a href="https://skan.al">skan.al</a></p>
            </div>
        </div>
    </div>
</body>
</html>
`;

const adminNotificationTemplate = (firstName, lastName, email, businessName) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kërkesë e Re për Demo - Skan.al</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f56565; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .info-item { margin: 10px 0; }
        .info-label { font-weight: bold; color: #4a5568; }
        .info-value { color: #2d3748; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Kërkesë e Re për Demo</h1>
            <p>Dikush ka kërkuar akses demo në Skan.al</p>
        </div>
        
        <div class="content">
            <h2>Të dhënat e kërkuesit:</h2>
            
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Emri i Plotë:</span>
                    <span class="info-value">${firstName} ${lastName}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${email}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Emri i Biznesit:</span>
                    <span class="info-value">${businessName}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Data e Kërkesës:</span>
                    <span class="info-value">${new Date().toLocaleString('sq-AL')}</span>
                </div>
            </div>
            
            <p><strong>Veprimi i kryer:</strong> Përdoruesi ka marrë automatikisht kredencialet e demo-s në email-in e tyre.</p>
            
            <p><strong>Kredencialet e dërguara:</strong></p>
            <ul>
                <li>Email: manager_email1@gmail.com</li>
                <li>Password: demo123</li>
                <li>Link: https://admin.skan.al/login</li>
            </ul>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            
            <p style="color: #718096; font-size: 14px;">
                Ky është një email automatik nga sistemi i formave të Netlify për Skan.al
            </p>
        </div>
    </div>
</body>
</html>
`;

exports.handler = async (event, context) => {
    // Only handle POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse form data
        const params = new URLSearchParams(event.body);
        const firstName = params.get('firstName');
        const lastName = params.get('lastName');
        const email = params.get('email');
        const businessName = params.get('businessName');

        // Validate required fields
        if (!firstName || !lastName || !email || !businessName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'All fields are required' })
            };
        }

        // Create transporter (using Netlify environment variables)
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        // Send email to user with demo credentials
        await transporter.sendMail({
            from: `"Skan.al" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🎉 Kredencialet tuaja të Demo-s - Skan.al',
            html: userEmailTemplate(firstName, lastName, businessName)
        });

        // Send notification email to admin
        await transporter.sendMail({
            from: `"Skan.al Notifications" <${process.env.GMAIL_USER}>`,
            to: 'enrizhulati@gmail.com',
            subject: `🚨 Kërkesë e Re për Demo - ${firstName} ${lastName} (${businessName})`,
            html: adminNotificationTemplate(firstName, lastName, email, businessName)
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Demo credentials sent successfully' 
            })
        };

    } catch (error) {
        console.error('Error sending demo credentials:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to send demo credentials',
                details: error.message 
            })
        };
    }
};