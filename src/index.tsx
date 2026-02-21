import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { 
  getCompetitions, 
  getMatches, 
  getMatchById,
  getStandings, 
  getTopScorers,
  getTeamById,
  getTeamMatches,
  getMatchesByDateRange,
  FootballApiEnv,
  COMPETITIONS_INFO,
  TRANSLATIONS
} from './footballApi';

type Bindings = {
  FOOTBALL_API_TOKEN?: string;
  DB: D1Database;
  SENDGRID_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'koorax_secret_key_change_in_production';

// Helper: Send verification email (using SendGrid)
async function sendVerificationEmail(email: string, token: string, apiKey?: string) {
  if (!apiKey) {
    console.log('⚠️ SendGrid API key not configured. Verification email not sent.');
    console.log('Verification link:', `https://your-domain.com/verify?token=${token}`);
    return;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: 'تأكيد البريد الإلكتروني - Koorax'
        }],
        from: { email: 'noreply@koorax.com', name: 'Koorax' },
        content: [{
          type: 'text/html',
          value: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                <h1 style="color: #7c3aed; text-align: center;">⚽ مرحبًا بك في Koorax</h1>
                <p style="font-size: 16px; line-height: 1.6;">
                  شكرًا لتسجيلك في موقع Koorax. للتأكيد على بريدك الإلكتروني، يرجى الضغط على الزر أدناه:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://your-domain.com/api/auth/verify-email?token=${token}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            display: inline-block;
                            font-weight: bold;">
                    تأكيد البريد الإلكتروني
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                  إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="text-align: center; color: #999; font-size: 12px;">
                  © 2024 Koorax. جميع الحقوق محفوظة.
                </p>
              </div>
            </div>
          `
        }]
      })
    });

    if (!response.ok) {
      console.error('SendGrid error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// Enable CORS
app.use('*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './' }));

// API Routes
app.get('/api/competitions', async (c) => {

// ===== AUTHENTICATION APIs =====

// Register new user
app.post('/api/auth/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json();
    
    // Validation
    if (!name || !email || !password) {
      return c.json({ error: 'جميع الحقول مطلوبة' }, 400);
    }
    
    if (password.length < 6) {
      return c.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, 400);
    }
    
    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: 'البريد الإلكتروني مسجل بالفعل' }, 400);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = nanoid(32);
    const tokenExpires = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
    
    // Check if admin email
    const isAdmin = email === 'TN@gmail.com' ? 1 : 0;
    
    // Insert user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (name, email, password_hash, verification_token, verification_token_expires, is_admin)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(name, email, passwordHash, verificationToken, tokenExpires, isAdmin).run();
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken, c.env.SENDGRID_API_KEY);
    
    return c.json({ 
      success: true, 
      message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني.',
      userId: result.meta.last_row_id
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'حدث خطأ أثناء التسجيل' }, 500);
  }
});

// Verify email
app.get('/api/auth/verify-email', async (c) => {
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head><meta charset="UTF-8"><title>خطأ في التحقق</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: red;">⚠️ رابط غير صالح</h1>
          <p>الرجاء التحقق من رابط التحقق المرسل إلى بريدك الإلكتروني.</p>
        </body>
        </html>
      `);
    }
    
    const user = await c.env.DB.prepare(`
      SELECT id, email, verification_token_expires 
      FROM users 
      WHERE verification_token = ? AND email_verified = 0
    `).bind(token).first();
    
    if (!user) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head><meta charset="UTF-8"><title>خطأ في التحقق</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: red;">⚠️ رابط غير صالح أو منتهي الصلاحية</h1>
          <p>هذا الحساب تم تفعيله مسبقاً أو الرابط غير صحيح.</p>
          <a href="/quiz" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">العودة للموقع</a>
        </body>
        </html>
      `);
    }
    
    // Check if token expired
    const now = Math.floor(Date.now() / 1000);
    if (user.verification_token_expires < now) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head><meta charset="UTF-8"><title>انتهت صلاحية الرابط</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: orange;">⏰ انتهت صلاحية رابط التحقق</h1>
          <p>الرجاء التسجيل مرة أخرى للحصول على رابط جديد.</p>
          <a href="/quiz" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">العودة للموقع</a>
        </body>
        </html>
      `);
    }
    
    // Verify email
    await c.env.DB.prepare(`
      UPDATE users 
      SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL 
      WHERE id = ?
    `).bind(user.id).run();
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تم التحقق بنجاح</title>
        <script>
          setTimeout(() => window.location.href = '/quiz', 3000);
        </script>
      </head>
      <body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; padding: 40px; border-radius: 20px; max-width: 500px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">✅ تم التحقق من بريدك الإلكتروني بنجاح!</h1>
          <p style="font-size: 18px; color: #666;">يمكنك الآن تسجيل الدخول والمشاركة في الفوازير.</p>
          <p style="color: #999; margin-top: 30px;">سيتم تحويلك تلقائيًا خلال 3 ثوانٍ...</p>
          <a href="/quiz" style="display: inline-block; margin-top: 20px; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">الذهاب للموقع الآن</a>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Email verification error:', error);
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head><meta charset="UTF-8"><title>خطأ</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: red;">⚠️ حدث خطأ</h1>
        <p>الرجاء المحاولة مرة أخرى أو التواصل مع الدعم.</p>
      </body>
      </html>
    `);
  }
});

// Login
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, 400);
    }
    
    // Get user
    const user = await c.env.DB.prepare(`
      SELECT id, name, email, password_hash, email_verified, is_admin, points
      FROM users 
      WHERE email = ?
    `).bind(email).first();
    
    if (!user) {
      return c.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401);
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return c.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401);
    }
    
    // Check if email verified
    if (!user.email_verified) {
      return c.json({ error: 'يرجى التحقق من بريدك الإلكتروني أولاً' }, 403);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin === 1,
        points: user.points,
        emailVerified: user.email_verified === 1
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, 500);
  }
});

// Get current user info
app.get('/api/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await c.env.DB.prepare(`
      SELECT id, name, email, is_admin, points, email_verified, created_at
      FROM users 
      WHERE id = ?
    `).bind(decoded.userId).first();
    
    if (!user) {
      return c.json({ error: 'المستخدم غير موجود' }, 404);
    }
    
    return c.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin === 1,
      points: user.points,
      emailVerified: user.email_verified === 1,
      joinedAt: user.created_at
    });
    
  } catch (error) {
    return c.json({ error: 'غير مصرح' }, 401);
  }
});

// ===== QUIZ APIs =====

// Get today's question
app.get('/api/quiz/today', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const question = await c.env.DB.prepare(`
      SELECT id, question, option_a, option_b, option_c, option_d, quiz_date
      FROM quiz_questions 
      WHERE quiz_date = ?
    `).bind(today).first();
    
    if (!question) {
      return c.json({ error: 'لا يوجد سؤال لهذا اليوم' }, 404);
    }
    
    // Check if user already answered (if authenticated)
    const authHeader = c.req.header('Authorization');
    let alreadyAnswered = false;
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        const answer = await c.env.DB.prepare(`
          SELECT id FROM user_answers 
          WHERE user_id = ? AND question_id = ?
        `).bind(decoded.userId, question.id).first();
        
        alreadyAnswered = !!answer;
      } catch (e) {
        // Invalid token, ignore
      }
    }
    
    return c.json({
      id: question.id,
      question: question.question,
      options: {
        A: question.option_a,
        B: question.option_b,
        C: question.option_c,
        D: question.option_d
      },
      date: question.quiz_date,
      alreadyAnswered
    });
    
  } catch (error) {
    console.error('Get today question error:', error);
    return c.json({ error: 'حدث خطأ أثناء جلب السؤال' }, 500);
  }
});

// Submit answer
app.post('/api/quiz/answer', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'يجب تسجيل الدخول' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const { questionId, answer } = await c.req.json();
    
    if (!questionId || !answer || !['A', 'B', 'C', 'D'].includes(answer)) {
      return c.json({ error: 'بيانات غير صالحة' }, 400);
    }
    
    // Get question
    const question = await c.env.DB.prepare(`
      SELECT id, correct_answer, quiz_date 
      FROM quiz_questions 
      WHERE id = ?
    `).bind(questionId).first();
    
    if (!question) {
      return c.json({ error: 'السؤال غير موجود' }, 404);
    }
    
    // Check if already answered
    const existing = await c.env.DB.prepare(`
      SELECT id FROM user_answers 
      WHERE user_id = ? AND question_id = ?
    `).bind(decoded.userId, questionId).first();
    
    if (existing) {
      return c.json({ error: 'لقد أجبت على هذا السؤال مسبقاً' }, 400);
    }
    
    // Check answer
    const isCorrect = answer === question.correct_answer;
    const pointsEarned = isCorrect ? 10 : 0;
    
    // Save answer
    await c.env.DB.prepare(`
      INSERT INTO user_answers (user_id, question_id, answer, is_correct, points_earned)
      VALUES (?, ?, ?, ?, ?)
    `).bind(decoded.userId, questionId, answer, isCorrect ? 1 : 0, pointsEarned).run();
    
    // Update user points
    if (isCorrect) {
      await c.env.DB.prepare(`
        UPDATE users SET points = points + ? WHERE id = ?
      `).bind(pointsEarned, decoded.userId).run();
    }
    
    return c.json({
      correct: isCorrect,
      correctAnswer: question.correct_answer,
      pointsEarned
    });
    
  } catch (error) {
    console.error('Submit answer error:', error);
    return c.json({ error: 'حدث خطأ أثناء إرسال الإجابة' }, 500);
  }
});

// Get leaderboard
app.get('/api/quiz/leaderboard', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.points,
        COUNT(CASE WHEN ua.is_correct = 1 THEN 1 END) as correct_answers,
        COUNT(ua.id) as total_answers
      FROM users u
      LEFT JOIN user_answers ua ON u.id = ua.user_id
      WHERE u.email_verified = 1 AND u.is_admin = 0
      GROUP BY u.id
      ORDER BY u.points DESC, correct_answers DESC
      LIMIT 10
    `).all();
    
    const leaderboard = result.results.map((user: any, index: number) => ({
      rank: index + 1,
      name: user.name,
      points: user.points,
      correctAnswers: user.correct_answers,
      totalAnswers: user.total_answers
    }));
    
    return c.json(leaderboard);
    
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return c.json({ error: 'حدث خطأ أثناء جلب لوحة المتصدرين' }, 500);
  }
});

// ===== ADMIN APIs =====

// Get stats (admin only)
app.get('/api/admin/stats', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const totalUsers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE is_admin = 0 AND email_verified = 1
    `).first();
    
    const totalQuestions = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM quiz_questions
    `).first();
    
    const today = new Date().toISOString().split('T')[0];
    const todayAnswers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM user_answers ua
      JOIN quiz_questions q ON ua.question_id = q.id
      WHERE q.quiz_date = ?
    `).bind(today).first();
    
    return c.json({
      totalUsers: totalUsers?.count || 0,
      totalQuestions: totalQuestions?.count || 0,
      todayAnswers: todayAnswers?.count || 0
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: 'حدث خطأ' }, 500);
  }
});

// Get all users (admin only)
app.get('/api/admin/users', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const result = await c.env.DB.prepare(`
      SELECT id, name, email, points, email_verified, created_at
      FROM users 
      WHERE is_admin = 0
      ORDER BY created_at DESC
    `).all();
    
    return c.json(result.results);
    
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'حدث خطأ' }, 500);
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const userId = parseInt(c.req.param('id'));
    
    await c.env.DB.prepare(`
      DELETE FROM users WHERE id = ? AND is_admin = 0
    `).bind(userId).run();
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'حدث خطأ' }, 500);
  }
});

// Add question (admin only)
app.post('/api/admin/question', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const { question, optionA, optionB, optionC, optionD, correctAnswer, quizDate } = await c.req.json();
    
    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !quizDate) {
      return c.json({ error: 'جميع الحقول مطلوبة' }, 400);
    }
    
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return c.json({ error: 'الإجابة الصحيحة يجب أن تكون A أو B أو C أو D' }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, quiz_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(question, optionA, optionB, optionC, optionD, correctAnswer, quizDate, decoded.userId).run();
    
    return c.json({ 
      success: true, 
      questionId: result.meta.last_row_id 
    });
    
  } catch (error: any) {
    console.error('Add question error:', error);
    if (error.message?.includes('UNIQUE')) {
      return c.json({ error: 'يوجد سؤال بالفعل لهذا التاريخ' }, 400);
    }
    return c.json({ error: 'حدث خطأ أثناء إضافة السؤال' }, 500);
  }
});


  try {
    const data = await getCompetitions({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN });
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch competitions' }, 500);
  }
});

app.get('/api/matches', async (c) => {
  try {
    const status = c.req.query('status');
    const data = await getMatches({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, status);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch matches' }, 500);
  }
});

app.get('/api/matches/:id', async (c) => {
  try {
    const matchId = parseInt(c.req.param('id'));
    const data = await getMatchById({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, matchId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch match details' }, 500);
  }
});

app.get('/api/competitions/:id/standings', async (c) => {
  try {
    const competitionId = parseInt(c.req.param('id'));
    const data = await getStandings({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, competitionId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch standings' }, 500);
  }
});

app.get('/api/competitions/:id/scorers', async (c) => {
  try {
    const competitionId = parseInt(c.req.param('id'));
    const data = await getTopScorers({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, competitionId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch top scorers' }, 500);
  }
});

app.get('/api/teams/:id', async (c) => {
  try {
    const teamId = parseInt(c.req.param('id'));
    const data = await getTeamById({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, teamId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch team details' }, 500);
  }
});

app.get('/api/teams/:id/matches', async (c) => {
  try {
    const teamId = parseInt(c.req.param('id'));
    const status = c.req.query('status');
    const data = await getTeamMatches({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, teamId, status);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch team matches' }, 500);
  }
});

// Enhanced Header with Burger Menu + Login System + Dark Mode + Language Toggle
function getEnhancedHeader(currentPage: string = '') {
  return `
<style>
/* Burger Menu Styles */
.burger-menu {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: 8px;
}
.burger-line {
  width: 24px;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  transition: all 0.3s ease;
}
.burger-menu.active .burger-line:nth-child(1) {
  transform: rotate(45deg) translateY(10px);
}
.burger-menu.active .burger-line:nth-child(2) {
  opacity: 0;
}
.burger-menu.active .burger-line:nth-child(3) {
  transform: rotate(-45deg) translateY(-10px);
}

/* Mobile Menu Overlay */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 999;
  display: none;
  animation: fadeIn 0.3s ease;
}
.mobile-menu-overlay.active {
  display: block;
}

.mobile-menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 280px;
  height: 100vh;
  background: linear-gradient(135deg, rgba(30, 30, 46, 0.98) 0%, rgba(24, 24, 38, 0.98) 100%);
  backdrop-filter: blur(20px);
  z-index: 1000;
  padding: 20px;
  transition: right 0.3s ease;
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.5);
  overflow-y: auto;
}
.mobile-menu.active {
  right: 0;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
  margin-bottom: 20px;
}

.mobile-menu-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 600;
}
.mobile-nav-link:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateX(-5px);
}
.mobile-nav-link.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.mobile-menu-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid rgba(102, 126, 234, 0.2);
}

/* User Profile Section */
.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(102, 126, 234, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}
.user-profile:hover {
  background: rgba(102, 126, 234, 0.2);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #fff;
}

/* Login Modal */
.login-modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}
.login-modal.active {
  display: flex;
}

.login-modal-content {
  background: linear-gradient(135deg, rgba(30, 30, 46, 0.98) 0%, rgba(24, 24, 38, 0.98) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  width: 90%;
  max-width: 450px;
  animation: scaleIn 0.3s ease;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
}

.form-input {
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;
}
.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.08);
}

.btn-primary {
  padding: 14px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.verification-message {
  padding: 12px;
  border-radius: 12px;
  background: rgba(102, 126, 234, 0.2);
  color: #fff;
  text-align: center;
  font-size: 14px;
}

.error-message {
  padding: 12px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  text-align: center;
  font-size: 14px;
}

.success-message {
  padding: 12px;
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  text-align: center;
  font-size: 14px;
}

@media (max-width: 768px) {
  .burger-menu {
    display: flex;
  }
  .desktop-nav-links {
    display: none !important;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>

<nav class="glass-card sticky top-0 z-50 mb-6">
  <div class="container mx-auto px-4 py-4">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-3 group">
        <i class="fas fa-futbol text-3xl gradient-text group-hover:rotate-[360deg] transition-transform duration-700"></i>
        <h1 class="text-2xl font-black gradient-text">Koorax</h1>
      </a>
      
      <!-- Desktop Navigation Links -->
      <div class="desktop-nav-links flex items-center gap-2">
        <a href="/" class="nav-link ${currentPage === 'home' ? 'active' : ''}">
          <i class="fas fa-home"></i>
          <span class="hidden md:inline" data-translate="home">الرئيسية</span>
        </a>
        <a href="/matches" class="nav-link ${currentPage === 'matches' ? 'active' : ''}">
          <i class="fas fa-calendar-alt"></i>
          <span class="hidden md:inline" data-translate="matches">المباريات</span>
        </a>
        <a href="/competitions" class="nav-link ${currentPage === 'competitions' ? 'active' : ''}">
          <i class="fas fa-trophy"></i>
          <span class="hidden md:inline" data-translate="competitions">البطولات</span>
        </a>
        <a href="/quiz" class="nav-link ${currentPage === 'quiz' ? 'active' : ''}">
          <i class="fas fa-question-circle"></i>
          <span class="hidden md:inline">الفزورة</span>
        </a>
      </div>

      <!-- Right Side Controls -->
      <div class="flex items-center gap-2">
        <!-- User Profile / Login Button -->
        <div id="user-section">
          <button onclick="kooraxShowLogin()" class="header-btn" id="login-btn">
            <i class="fas fa-user"></i>
            <span class="hidden md:inline" data-translate="login">دخول</span>
          </button>
          <div onclick="kooraxToggleUserMenu()" class="user-profile" id="user-profile" style="display: none;">
            <div class="user-avatar" id="user-avatar"></div>
            <span class="hidden md:inline" id="user-name"></span>
            <i class="fas fa-chevron-down text-xs"></i>
          </div>
        </div>
        
        <!-- Dark Mode Toggle -->
        <button onclick="kooraxToggleDarkMode()" class="header-btn" title="Toggle Dark Mode">
          <i id="theme-toggle-icon" class="fas fa-moon"></i>
        </button>
        
        <!-- Language Toggle -->
        <button onclick="kooraxToggleLanguage()" class="header-btn" title="تبديل اللغة / Toggle Language">
          <i class="fas fa-language"></i>
          <span class="hidden md:inline" id="lang-toggle-text">EN</span>
        </button>
        
        <!-- Burger Menu Button (Mobile Only) -->
        <div class="burger-menu" onclick="kooraxToggleMobileMenu()">
          <div class="burger-line"></div>
          <div class="burger-line"></div>
          <div class="burger-line"></div>
        </div>
      </div>
    </div>
  </div>
</nav>

<!-- Mobile Menu Overlay -->
<div class="mobile-menu-overlay" id="mobile-menu-overlay" onclick="kooraxCloseMobileMenu()"></div>

<!-- Mobile Menu -->
<div class="mobile-menu" id="mobile-menu">
  <div class="mobile-menu-header">
    <div class="flex items-center gap-2">
      <i class="fas fa-futbol text-2xl gradient-text"></i>
      <h2 class="text-xl font-black gradient-text">Koorax</h2>
    </div>
    <button onclick="kooraxCloseMobileMenu()" class="text-white text-2xl">
      <i class="fas fa-times"></i>
    </button>
  </div>
  
  <div class="mobile-menu-links">
    <a href="/" class="mobile-nav-link ${currentPage === 'home' ? 'active' : ''}">
      <i class="fas fa-home"></i>
      <span data-translate="home">الرئيسية</span>
    </a>
    <a href="/matches" class="mobile-nav-link ${currentPage === 'matches' ? 'active' : ''}">
      <i class="fas fa-calendar-alt"></i>
      <span data-translate="matches">المباريات</span>
    </a>
    <a href="/competitions" class="mobile-nav-link ${currentPage === 'competitions' ? 'active' : ''}">
      <i class="fas fa-trophy"></i>
      <span data-translate="competitions">البطولات</span>
    </a>
    <a href="/quiz" class="mobile-nav-link ${currentPage === 'quiz' ? 'active' : ''}">
      <i class="fas fa-question-circle"></i>
      <span>الفزورة</span>
    </a>
  </div>
  
  <div class="mobile-menu-footer">
    <div id="mobile-user-section">
      <button onclick="kooraxShowLogin(); kooraxCloseMobileMenu();" class="btn-primary w-full" id="mobile-login-btn">
        <i class="fas fa-user"></i>
        <span data-translate="login">تسجيل دخول</span>
      </button>
      <div class="user-profile" id="mobile-user-profile" style="display: none;">
        <div class="user-avatar" id="mobile-user-avatar"></div>
        <span id="mobile-user-name"></span>
      </div>
      <button onclick="kooraxLogout(); kooraxCloseMobileMenu();" class="btn-secondary w-full mt-2" id="mobile-logout-btn" style="display: none;">
        <i class="fas fa-sign-out-alt"></i>
        <span data-translate="logout">تسجيل خروج</span>
      </button>
    </div>
  </div>
</div>

<!-- Login Modal -->
<div class="login-modal" id="login-modal">
  <div class="login-modal-content">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-black gradient-text">
        <i class="fas fa-user-circle"></i>
        <span data-translate="login">تسجيل دخول</span>
      </h2>
      <button onclick="kooraxCloseLogin()" class="text-white text-2xl">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div id="login-step-1" class="login-form">
      <div class="form-group">
        <label class="form-label" for="email-input">
          <i class="fas fa-envelope"></i>
          <span data-translate="email">البريد الإلكتروني</span>
        </label>
        <input type="email" id="email-input" class="form-input" placeholder="your@email.com" required>
      </div>
      
      <div id="login-error" class="error-message" style="display: none;"></div>
      
      <button onclick="kooraxSendVerificationCode()" class="btn-primary" id="send-code-btn">
        <i class="fas fa-paper-plane"></i>
        <span data-translate="sendCode">إرسال رمز التحقق</span>
      </button>
    </div>
    
    <div id="login-step-2" class="login-form" style="display: none;">
      <div class="verification-message">
        <i class="fas fa-info-circle"></i>
        <span data-translate="verificationSent">تم إرسال رمز التحقق إلى بريدك الإلكتروني</span>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="code-input">
          <i class="fas fa-key"></i>
          <span data-translate="verificationCode">رمز التحقق</span>
        </label>
        <input type="text" id="code-input" class="form-input" placeholder="123456" maxlength="6" required>
      </div>
      
      <div id="verification-error" class="error-message" style="display: none;"></div>
      
      <button onclick="kooraxVerifyCode()" class="btn-primary" id="verify-btn">
        <i class="fas fa-check-circle"></i>
        <span data-translate="verify">تحقق</span>
      </button>
      
      <button onclick="kooraxBackToEmail()" class="btn-secondary">
        <i class="fas fa-arrow-right"></i>
        <span data-translate="back">رجوع</span>
      </button>
    </div>
  </div>
</div>

<script>
// Mobile Menu Functions
function kooraxToggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  const burger = document.querySelector('.burger-menu');
  
  menu.classList.toggle('active');
  overlay.classList.toggle('active');
  burger.classList.toggle('active');
  
  // Prevent body scroll when menu is open
  document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
}

function kooraxCloseMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  const burger = document.querySelector('.burger-menu');
  
  menu.classList.remove('active');
  overlay.classList.remove('active');
  burger.classList.remove('active');
  document.body.style.overflow = '';
}

// Login System Functions
let currentUserEmail = '';
let verificationCodeSent = '';

function kooraxShowLogin() {
  document.getElementById('login-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function kooraxCloseLogin() {
  document.getElementById('login-modal').classList.remove('active');
  document.body.style.overflow = '';
  kooraxResetLoginForm();
}

function kooraxResetLoginForm() {
  document.getElementById('login-step-1').style.display = 'block';
  document.getElementById('login-step-2').style.display = 'none';
  document.getElementById('email-input').value = '';
  document.getElementById('code-input').value = '';
  document.getElementById('login-error').style.display = 'none';
  document.getElementById('verification-error').style.display = 'none';
}

async function kooraxSendVerificationCode() {
  const email = document.getElementById('email-input').value.trim();
  const errorDiv = document.getElementById('login-error');
  const sendBtn = document.getElementById('send-code-btn');
  
  if (!email || !email.includes('@')) {
    errorDiv.textContent = 'يرجى إدخال بريد إلكتروني صحيح';
    errorDiv.style.display = 'block';
    return;
  }
  
  errorDiv.style.display = 'none';
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
  
  try {
    // TODO: Replace with actual API call
    // const response = await axios.post('/api/auth/send-code', { email });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock verification code (for demo)
    verificationCodeSent = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Verification code (for demo):', verificationCodeSent);
    
    currentUserEmail = email;
    
    // Show step 2
    document.getElementById('login-step-1').style.display = 'none';
    document.getElementById('login-step-2').style.display = 'block';
    
  } catch (error) {
    errorDiv.textContent = 'حدث خطأ أثناء الإرسال. حاول مرة أخرى';
    errorDiv.style.display = 'block';
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال رمز التحقق';
  }
}

async function kooraxVerifyCode() {
  const code = document.getElementById('code-input').value.trim();
  const errorDiv = document.getElementById('verification-error');
  const verifyBtn = document.getElementById('verify-btn');
  
  if (!code || code.length !== 6) {
    errorDiv.textContent = 'يرجى إدخال رمز التحقق المكون من 6 أرقام';
    errorDiv.style.display = 'block';
    return;
  }
  
  errorDiv.style.display = 'none';
  verifyBtn.disabled = true;
  verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
  
  try {
    // TODO: Replace with actual API call
    // const response = await axios.post('/api/auth/verify-code', { email: currentUserEmail, code });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check code (for demo)
    if (code === verificationCodeSent) {
      // Generate user data
      const userName = currentUserEmail.split('@')[0];
      const userData = {
        email: currentUserEmail,
        name: userName,
        points: 0,
        joinedAt: new Date().toISOString()
      };
      
      // Store in localStorage
      localStorage.setItem('koorax_user', JSON.stringify(userData));
      
      // Update UI
      kooraxUpdateUserUI(userData);
      kooraxCloseLogin();
      
      // Show success message
      alert('✅ تم تسجيل الدخول بنجاح!');
      
    } else {
      errorDiv.textContent = 'رمز التحقق غير صحيح';
      errorDiv.style.display = 'block';
    }
    
  } catch (error) {
    errorDiv.textContent = 'حدث خطأ أثناء التحقق. حاول مرة أخرى';
    errorDiv.style.display = 'block';
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> تحقق';
  }
}

function kooraxBackToEmail() {
  document.getElementById('login-step-1').style.display = 'block';
  document.getElementById('login-step-2').style.display = 'none';
  document.getElementById('verification-error').style.display = 'none';
}

function kooraxUpdateUserUI(userData) {
  // Desktop UI
  document.getElementById('login-btn').style.display = 'none';
  document.getElementById('user-profile').style.display = 'flex';
  document.getElementById('user-name').textContent = userData.name;
  document.getElementById('user-avatar').textContent = userData.name.charAt(0).toUpperCase();
  
  // Mobile UI
  document.getElementById('mobile-login-btn').style.display = 'none';
  document.getElementById('mobile-user-profile').style.display = 'flex';
  document.getElementById('mobile-logout-btn').style.display = 'block';
  document.getElementById('mobile-user-name').textContent = userData.name;
  document.getElementById('mobile-user-avatar').textContent = userData.name.charAt(0).toUpperCase();
}

function kooraxToggleUserMenu() {
  // TODO: Show user dropdown menu with logout option
  if (confirm('هل تريد تسجيل الخروج؟')) {
    kooraxLogout();
  }
}

function kooraxLogout() {
  localStorage.removeItem('koorax_user');
  
  // Desktop UI
  document.getElementById('login-btn').style.display = 'flex';
  document.getElementById('user-profile').style.display = 'none';
  
  // Mobile UI
  document.getElementById('mobile-login-btn').style.display = 'block';
  document.getElementById('mobile-user-profile').style.display = 'none';
  document.getElementById('mobile-logout-btn').style.display = 'none';
  
  alert('تم تسجيل الخروج بنجاح');
  window.location.reload();
}

// Check if user is logged in on page load
function kooraxCheckAuth() {
  const userData = localStorage.getItem('koorax_user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      kooraxUpdateUserUI(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('koorax_user');
    }
  }
}

// Initialize auth check on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', kooraxCheckAuth);
} else {
  kooraxCheckAuth();
}
</script>
  `;
}

// Homepage
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - مباريات كرة القدم</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader('home')}
    
    <div class="container mx-auto px-4 py-6">
        <!-- Live Matches Section -->
        <div id="live-section" style="display: none;" class="mb-8">
          <div class="glass-card p-6 rounded-2xl">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <h2 class="text-3xl font-black gradient-text">
                <span data-translate="liveMatches">🔴 مباريات مباشرة الآن</span>
              </h2>
            </div>
            <div id="live-matches" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"></div>
          </div>
        </div>
        
        <!-- Important Matches Today -->
        <div class="glass-card p-6 rounded-2xl mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-black gradient-text">
              <i class="fas fa-star mr-3"></i>
              <span data-translate="importantMatches">أهم المباريات</span>
            </h2>
            <a href="/matches" class="text-primary hover:underline">
              <span data-translate="viewAll">عرض الكل</span>
              <i class="fas fa-arrow-left mr-2"></i>
            </a>
          </div>
          <div id="important-matches" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
          </div>
        </div>
        
        <!-- Quick Links - Only Matches and Competitions -->
        <div class="grid grid-cols-2 gap-4">
          <a href="/matches" class="glass-card p-8 text-center hover:scale-105 transition-transform">
            <i class="fas fa-calendar-alt text-5xl text-primary mb-4"></i>
            <h3 class="text-xl font-bold" data-translate="matches">المباريات</h3>
          </a>
          <a href="/competitions" class="glass-card p-8 text-center hover:scale-105 transition-transform">
            <i class="fas fa-trophy text-5xl text-yellow-500 mb-4"></i>
            <h3 class="text-xl font-bold" data-translate="competitions">البطولات</h3>
          </a>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      function getStatusText(status) {
        const t = window.kooraxT;
        if (status === 'IN_PLAY' || status === 'PAUSED') return t('live');
        if (status === 'FINISHED') return t('finished');
        return t('scheduled');
      }

      async function loadHomeMatches() {
        try {
          const response = await axios.get('/api/matches');
          const matches = response.data.matches;
          
          // Filter live matches
          const liveMatches = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
          const upcomingToday = matches.filter(m => {
            const matchDate = new Date(m.utcDate);
            const today = new Date();
            return matchDate.toDateString() === today.toDateString() && m.status === 'SCHEDULED';
          }).slice(0, 6);
          
          // Show live matches
          if (liveMatches.length > 0) {
            document.getElementById('live-section').style.display = 'block';
            document.getElementById('live-matches').innerHTML = liveMatches.map(createMatchCard).join('');
          }
          
          // Show important matches (live + upcoming today)
          const importantMatches = [...liveMatches, ...upcomingToday].slice(0, 6);
          const t = window.kooraxT;
          document.getElementById('important-matches').innerHTML = 
            importantMatches.length > 0 
              ? importantMatches.map(createMatchCard).join('') 
              : '<p class="text-center text-secondary col-span-2 py-12" data-translate="noMatches">لا توجد مباريات مهمة اليوم</p>';
          
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading matches:', error);
          document.getElementById('important-matches').innerHTML = 
            '<p class="text-center text-red-500 col-span-2 py-12" data-translate="error">حدث خطأ في تحميل المباريات</p>';
          window.kooraxApplyTranslations();
        }
      }
      
      function createMatchCard(match) {
        const t = window.kooraxT;
        const statusBadge = match.status === 'IN_PLAY' || match.status === 'PAUSED'
          ? \`<span class="status-live">\${t('live')}</span>\`
          : match.status === 'FINISHED'
          ? \`<span class="status-finished">\${t('finished')}</span>\`
          : \`<span class="status-scheduled">\${t('scheduled')}</span>\`;
        
        const score = (match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED')
          ? \`<div class="score-display">\${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}</div>\`
          : \`<div class="text-lg text-secondary">\${new Date(match.utcDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</div>\`;
        
        return \`
          <a href="/matches/\${match.id}" class="match-card block">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-secondary">\${match.competition.name}</span>
              \${statusBadge}
            </div>
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 flex-1">
                <img src="\${match.homeTeam.crest || ''}" alt="\${match.homeTeam.name}" class="team-logo w-12 h-12" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
                <span class="font-bold truncate">\${match.homeTeam.name}</span>
              </div>
              <div class="text-center px-4">
                \${score}
              </div>
              <div class="flex items-center gap-3 flex-1 justify-end">
                <span class="font-bold truncate">\${match.awayTeam.name}</span>
                <img src="\${match.awayTeam.crest || ''}" alt="\${match.awayTeam.name}" class="team-logo w-12 h-12" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
              </div>
            </div>
          </a>
        \`;
      }
      
      loadHomeMatches();
      setInterval(loadHomeMatches, 60000); // Refresh every minute
      
      // Listen for language changes
      window.addEventListener('language-changed', () => {
        loadHomeMatches();
      });
    </script>
</body>
</html>
  `);
});


// Matches page - Complete with Date Filter + Competition Grouping + Mobile Menu
app.get('/matches', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - المباريات</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
    <style>
      .date-filter-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        padding: 0.75rem 1rem;
        border-radius: 12px;
        transition: all 0.3s ease;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        min-width: 80px;
      }
      .date-filter-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--primary);
        transform: translateY(-2px);
      }
      .date-filter-btn.active {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        border-color: var(--primary);
        box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
      }
      .date-label {
        font-size: 0.75rem;
        opacity: 0.8;
      }
      .date-number {
        font-size: 1.25rem;
        font-weight: bold;
      }
      .date-filter-container {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        padding: 0.5rem 0;
        scrollbar-width: thin;
      }
      .date-filter-container::-webkit-scrollbar {
        height: 4px;
      }
      .date-filter-container::-webkit-scrollbar-thumb {
        background: var(--primary);
        border-radius: 4px;
      }
    </style>
</head>
<body>
    ${getEnhancedHeader('matches')}
    
    <div class="container mx-auto px-4 py-6">
        <!-- Page Title -->
        <div class="glass-card p-6 rounded-2xl mb-6">
          <h1 class="text-4xl font-black gradient-text mb-2">
            <i class="fas fa-calendar-alt mr-3"></i>
            <span data-translate="allMatches">جميع المباريات</span>
          </h1>
        </div>

        <!-- Date Filter -->
        <div class="glass-card p-4 rounded-2xl mb-6">
          <h3 class="text-lg font-bold mb-3">
            <i class="fas fa-calendar-day mr-2"></i>
            <span data-translate="selectDate">اختر اليوم</span>
          </h3>
          <div class="date-filter-container" id="date-filter-container">
            <!-- Will be filled by JavaScript -->
          </div>
        </div>

        <!-- Status Filters -->
        <div class="glass-card p-6 rounded-2xl mb-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onclick="filterMatches('all')" class="filter-btn active" data-filter="all">
              <i class="fas fa-list mr-2"></i>
              <span data-translate="all">الكل</span>
            </button>
            <button onclick="filterMatches('live')" class="filter-btn" data-filter="live">
              <i class="fas fa-circle text-red-500 mr-2"></i>
              <span data-translate="live">مباشر</span>
            </button>
            <button onclick="filterMatches('scheduled')" class="filter-btn" data-filter="scheduled">
              <i class="fas fa-clock mr-2"></i>
              <span data-translate="scheduled">لم تبدأ</span>
            </button>
            <button onclick="filterMatches('finished')" class="filter-btn" data-filter="finished">
              <i class="fas fa-check-circle mr-2"></i>
              <span data-translate="finished">انتهت</span>
            </button>
          </div>
        </div>

        <!-- Matches Container -->
        <div id="matches-container">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
          </div>
        </div>
    </div>
    
    <!-- Mobile Menu Bar -->
    <div class="mobile-menu-bar">
      <nav>
        <a href="/" class="mobile-menu-item">
          <i class="fas fa-home"></i>
          <span data-translate="home">الرئيسية</span>
        </a>
        <a href="/matches" class="mobile-menu-item active">
          <i class="fas fa-calendar-alt"></i>
          <span data-translate="matches">المباريات</span>
        </a>
        <a href="/competitions" class="mobile-menu-item">
          <i class="fas fa-trophy"></i>
          <span data-translate="competitions">البطولات</span>
        </a>
      </nav>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      let allMatches = [];
      let currentFilter = 'all';
      let currentDate = null;
      
      // Competition importance ranking
      const competitionImportance = {
        2001: 10, // Champions League
        2021: 9,  // Premier League
        2014: 8,  // La Liga
        2019: 7,  // Serie A
        2002: 6,  // Bundesliga
        2015: 5,  // Ligue 1
        2018: 4,  // European Championship
        2000: 3,  // World Cup
        2152: 2,  // Copa Libertadores
      };

      function generateDateButtons() {
        const container = document.getElementById('date-filter-container');
        const today = new Date();
        const dates = [];
        
        // Generate 5 days (2 past + today + 2 future)
        for (let i = -2; i <= 2; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date);
        }
        
        const t = window.kooraxT || (key => key);
        const lang = document.documentElement.lang;
        
        container.innerHTML = dates.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const dayName = date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
          const dayNumber = date.getDate();
          const isToday = date.toDateString() === today.toDateString();
          
          return \`
            <button 
              onclick="filterByDate('\${dateStr}')" 
              class="date-filter-btn \${isToday ? 'active' : ''}" 
              data-date="\${dateStr}">
              <span class="date-label">\${dayName}</span>
              <span class="date-number">\${dayNumber}</span>
              \${isToday ? '<i class="fas fa-star text-yellow-400 text-xs"></i>' : ''}
            </button>
          \`;
        }).join('');
        
        // Set today as default
        currentDate = today.toISOString().split('T')[0];
      }

      async function loadAllMatches() {
        try {
          const response = await axios.get('/api/matches');
          allMatches = response.data.matches;
          generateDateButtons();
          displayMatches();
        } catch (error) {
          console.error('Error loading matches:', error);
          const t = window.kooraxT;
          document.getElementById('matches-container').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }

      function filterByDate(dateStr) {
        currentDate = dateStr;
        
        // Update active date button
        document.querySelectorAll('.date-filter-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.getAttribute('data-date') === dateStr) {
            btn.classList.add('active');
          }
        });
        
        displayMatches();
      }

      function filterMatches(filter) {
        currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
          }
        });
        
        displayMatches();
      }

      function getCompetitionImportance(compId) {
        return competitionImportance[compId] || 0;
      }

      function displayMatches() {
        let filtered = allMatches;
        
        // Filter by date first (if date is selected)
        if (currentDate) {
          filtered = filtered.filter(m => {
            const matchDate = new Date(m.utcDate).toISOString().split('T')[0];
            return matchDate === currentDate;
          });
        }
        
        // Filter by status (always apply)
        if (currentFilter === 'live') {
          filtered = filtered.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
        } else if (currentFilter === 'scheduled') {
          filtered = filtered.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED');
        } else if (currentFilter === 'finished') {
          filtered = filtered.filter(m => m.status === 'FINISHED');
        }
        // 'all' means no status filter, show all matches
        
        const t = window.kooraxT;
        const container = document.getElementById('matches-container');
        
        if (filtered.length === 0) {
          container.innerHTML = \`
            <div class="glass-card p-12 text-center rounded-2xl">
              <i class="fas fa-calendar-times text-6xl text-secondary mb-4"></i>
              <p class="text-xl text-secondary" data-translate="noMatches">\${t('noMatches')}</p>
            </div>
          \`;
          return;
        }
        
        // Group by competition
        const grouped = {};
        filtered.forEach(match => {
          const compId = match.competition.id;
          if (!grouped[compId]) {
            grouped[compId] = {
              competition: match.competition,
              matches: [],
              importance: getCompetitionImportance(compId)
            };
          }
          grouped[compId].matches.push(match);
        });
        
        // Sort competitions by importance
        const sortedGroups = Object.values(grouped).sort((a, b) => b.importance - a.importance);
        
        let html = '';
        sortedGroups.forEach(group => {
          html += \`
            <div class="glass-card p-6 rounded-2xl mb-6">
              <h2 class="text-2xl font-bold gradient-text mb-4 flex items-center gap-3">
                <span>\${group.competition.emblem ? \`<img src="\${group.competition.emblem}" class="w-8 h-8" onerror="this.style.display='none'">\` : ''}</span>
                <span>\${group.competition.name}</span>
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                \${group.matches.map(createMatchCard).join('')}
              </div>
            </div>
          \`;
        });
        
        container.innerHTML = html;
      }

      function createMatchCard(match) {
        const t = window.kooraxT;
        const statusBadge = match.status === 'IN_PLAY' || match.status === 'PAUSED'
          ? \`<span class="status-live">\${t('live')}</span>\`
          : match.status === 'FINISHED'
          ? \`<span class="status-finished">\${t('finished')}</span>\`
          : \`<span class="status-scheduled">\${t('scheduled')}</span>\`;
        
        const score = (match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED')
          ? \`<div class="score-display">\${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}</div>\`
          : \`<div class="text-lg text-secondary">\${new Date(match.utcDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</div>\`;
        
        return \`
          <a href="/matches/\${match.id}" class="match-card block">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-secondary">\${new Date(match.utcDate).toLocaleDateString('ar-EG')}</span>
              \${statusBadge}
            </div>
            <div class="flex items-center justify-between gap-2 md:gap-4">
              <div class="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <img src="\${match.homeTeam.crest || ''}" alt="\${match.homeTeam.name}" class="team-logo w-10 h-10 md:w-12 md:h-12 flex-shrink-0" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
                <span class="font-bold truncate text-sm md:text-base">\${match.homeTeam.name}</span>
              </div>
              <div class="text-center px-2 md:px-4 flex-shrink-0">
                \${score}
              </div>
              <div class="flex items-center gap-2 md:gap-3 flex-1 justify-end min-w-0">
                <span class="font-bold truncate text-sm md:text-base">\${match.awayTeam.name}</span>
                <img src="\${match.awayTeam.crest || ''}" alt="\${match.awayTeam.name}" class="team-logo w-10 h-10 md:w-12 md:h-12 flex-shrink-0" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
              </div>
            </div>
          </a>
        \`;
      }
      
      loadAllMatches();
      
      // Auto refresh
      setInterval(loadAllMatches, 60000);
      
      // Re-render on language change
      window.addEventListener('languageChanged', displayMatches);
    </script>
</body>
</html>
  `)
})


// Match Details page - COMPLETE with scorer/assist names + cards + live minute
app.get('/matches/:id', (c) => {
  const matchId = c.req.param('id');
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - تفاصيل المباراة</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
    <style>
      .event-timeline {
        position: relative;
        padding-left: 30px;
      }
      .event-timeline::before {
        content: '';
        position: absolute;
        left: 15px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--border);
      }
      .event-item {
        position: relative;
        margin-bottom: 20px;
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem;
        border-radius: 12px;
        transition: all 0.3s ease;
      }
      .event-item:hover {
        background: rgba(255, 255, 255, 0.06);
        transform: translateX(-5px);
      }
      .event-item::before {
        content: '';
        position: absolute;
        left: -23px;
        top: 18px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--primary);
        border: 3px solid var(--bg-card);
        z-index: 1;
      }
      .event-item.goal::before { background: #10b981; }
      .event-item.yellow-card::before { background: #fbbf24; }
      .event-item.red-card::before { background: #ef4444; }
      .event-item.substitution::before { background: #3b82f6; }
      
      .scorer-name {
        font-size: 1.125rem;
        font-weight: bold;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
      }
      .assist-name {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-style: italic;
      }
      .card-player-name {
        font-weight: 600;
        color: var(--text-primary);
      }
      .stat-bar {
        height: 8px;
        border-radius: 4px;
        background: var(--border);
        overflow: hidden;
      }
      .stat-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary), var(--primary-light));
        transition: width 0.5s ease;
      }
      .lineup-player {
        background: rgba(255, 255, 255, 0.03);
        padding: 0.75rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
      }
      .lineup-player:hover {
        background: rgba(255, 255, 255, 0.06);
      }
    </style>
</head>
<body>
    ${getEnhancedHeader()}
    
    <div class="container mx-auto px-4 py-6 pb-24">
        <!-- Back Button -->
        <div class="mb-4">
          <a href="/matches" class="inline-flex items-center gap-2 text-primary hover:underline">
            <i class="fas fa-arrow-right"></i>
            <span data-translate="backToMatches">العودة للمباريات</span>
          </a>
        </div>
        
        <div id="match-details-container">
          <div class="skeleton h-96"></div>
        </div>
    </div>
    
    <!-- Mobile Menu Bar -->
    <div class="mobile-menu-bar">
      <nav>
        <a href="/" class="mobile-menu-item">
          <i class="fas fa-home"></i>
          <span data-translate="home">الرئيسية</span>
        </a>
        <a href="/matches" class="mobile-menu-item active">
          <i class="fas fa-calendar-alt"></i>
          <span data-translate="matches">المباريات</span>
        </a>
        <a href="/competitions" class="mobile-menu-item">
          <i class="fas fa-trophy"></i>
          <span data-translate="competitions">البطولات</span>
        </a>
      </nav>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      const matchId = ${matchId};
      
      async function loadMatchDetails() {
        try {
          const response = await axios.get(\`/api/matches/\${matchId}\`);
          const match = response.data;
          displayMatchDetails(match);
        } catch (error) {
          console.error('Error loading match details:', error);
          const t = window.kooraxT;
          document.getElementById('match-details-container').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }

      function displayMatchDetails(match) {
        const t = window.kooraxT;
        const container = document.getElementById('match-details-container');
        
        const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
        const isFinished = match.status === 'FINISHED';
        
        // Status badge
        let statusHtml = '';
        if (isLive) {
          statusHtml = \`<span class="status-live">\${t('live')}</span>\`;
        } else if (isFinished) {
          statusHtml = \`<span class="status-finished">\${t('finished')}</span>\`;
        } else {
          statusHtml = \`<span class="status-scheduled">\${t('scheduled')}</span>\`;
        }

        // Competition info
        const compHtml = \`
          <div class="glass-card p-4 rounded-2xl mb-6">
            <div class="flex items-center gap-3">
              \${match.competition.emblem ? \`<img src="\${match.competition.emblem}" class="w-8 h-8">\` : ''}
              <h2 class="text-lg font-bold">\${match.competition.name}</h2>
            </div>
          </div>
        \`;

        // Teams and Score
        const scoreHtml = (isFinished || isLive)
          ? \`
            <div class="text-center">
              <div class="text-5xl md:text-7xl font-black gradient-text mb-2">
                \${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}
              </div>
              \${match.score.halfTime ? \`
                <div class="text-lg text-secondary">
                  (\${match.score.halfTime.home || 0} - \${match.score.halfTime.away || 0})
                  <span class="text-sm">\${t('halfTime') || 'الشوط الأول'}</span>
                </div>
              \` : ''}
            </div>
          \`
          : \`
            <div class="text-center text-2xl text-secondary">
              \${new Date(match.utcDate).toLocaleString(t('language') === 'ar' ? 'ar-EG' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          \`;

        const teamsHtml = \`
          <div class="glass-card p-6 md:p-8 rounded-2xl mb-6">
            <div class="flex flex-col md:flex-row items-center justify-between gap-6">
              <!-- Home Team -->
              <div class="flex flex-col items-center flex-1 text-center">
                <img src="\${match.homeTeam.crest}" alt="\${match.homeTeam.name}" 
                     class="w-20 h-20 md:w-32 md:h-32 mb-4">
                <h3 class="text-xl md:text-2xl font-bold">\${match.homeTeam.name}</h3>
              </div>
              
              <!-- Score -->
              <div class="flex flex-col items-center gap-4">
                \${statusHtml}
                \${scoreHtml}
              </div>
              
              <!-- Away Team -->
              <div class="flex flex-col items-center flex-1 text-center">
                <img src="\${match.awayTeam.crest}" alt="\${match.awayTeam.name}" 
                     class="w-20 h-20 md:w-32 md:h-32 mb-4">
                <h3 class="text-xl md:text-2xl font-bold">\${match.awayTeam.name}</h3>
              </div>
            </div>
          </div>
        \`;

        // Match Info
        const matchInfoHtml = \`
          <div class="glass-card p-6 rounded-2xl mb-6">
            <h3 class="text-xl font-bold mb-4">
              <i class="fas fa-info-circle mr-2"></i>
              \${t('matchInfo') || 'معلومات المباراة'}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              \${match.venue ? \`
                <div class="flex items-center gap-2">
                  <i class="fas fa-map-marker-alt text-primary"></i>
                  <span>\${match.venue}</span>
                </div>
              \` : ''}
              \${match.referee ? \`
                <div class="flex items-center gap-2">
                  <i class="fas fa-user-tie text-primary"></i>
                  <span>\${match.referee}</span>
                </div>
              \` : ''}
              \${match.attendance ? \`
                <div class="flex items-center gap-2">
                  <i class="fas fa-users text-primary"></i>
                  <span>\${match.attendance.toLocaleString()}</span>
                </div>
              \` : ''}
            </div>
          </div>
        \`;

        // Events Timeline
        let eventsHtml = '';
        if (match.goals && match.goals.length > 0) {
          const allEvents = [];
          
          // Add goals
          match.goals.forEach(goal => {
            allEvents.push({
              type: 'goal',
              minute: goal.minute,
              team: goal.team.name,
              player: goal.scorer?.name || t('unknown'),
              assist: goal.assist?.name,
              icon: 'fa-futbol',
              color: '#10b981'
            });
          });
          
          // Add bookings (cards)
          if (match.bookings && match.bookings.length > 0) {
            match.bookings.forEach(booking => {
              allEvents.push({
                type: booking.card === 'YELLOW_CARD' ? 'yellow-card' : 'red-card',
                minute: booking.minute,
                team: booking.team.name,
                player: booking.player?.name || t('unknown'),
                card: booking.card,
                icon: booking.card === 'YELLOW_CARD' ? 'fa-square' : 'fa-square',
                color: booking.card === 'YELLOW_CARD' ? '#fbbf24' : '#ef4444'
              });
            });
          }
          
          // Add substitutions
          if (match.substitutions && match.substitutions.length > 0) {
            match.substitutions.forEach(sub => {
              allEvents.push({
                type: 'substitution',
                minute: sub.minute,
                team: sub.team.name,
                playerOut: sub.playerOut?.name || t('unknown'),
                playerIn: sub.playerIn?.name || t('unknown'),
                icon: 'fa-exchange-alt',
                color: '#3b82f6'
              });
            });
          }
          
          // Sort by minute
          allEvents.sort((a, b) => (a.minute || 0) - (b.minute || 0));
          
          if (allEvents.length > 0) {
            eventsHtml = \`
              <div class="glass-card p-6 rounded-2xl mb-6">
                <h3 class="text-xl font-bold mb-4">
                  <i class="fas fa-list-ul mr-2"></i>
                  \${t('events') || 'أحداث المباراة'}
                </h3>
                <div class="event-timeline">
                  \${allEvents.map(event => {
                    if (event.type === 'goal') {
                      return \`
                        <div class="event-item goal">
                          <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                              <div class="flex items-center gap-2 mb-2">
                                <i class="fas \${event.icon} text-green-500"></i>
                                <span class="font-bold text-xl">\${event.minute}'</span>
                                <span class="text-secondary">- \${event.team}</span>
                              </div>
                              <div class="scorer-name">
                                <i class="fas fa-user-circle mr-2"></i>\${event.player}
                              </div>
                              \${event.assist ? \`
                                <div class="assist-name">
                                  <i class="fas fa-hands-helping mr-2"></i>
                                  \${t('assist') || 'صناعة'}: \${event.assist}
                                </div>
                              \` : ''}
                            </div>
                          </div>
                        </div>
                      \`;
                    } else if (event.type === 'yellow-card' || event.type === 'red-card') {
                      return \`
                        <div class="event-item \${event.type}">
                          <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                              <div class="flex items-center gap-2 mb-2">
                                <i class="fas \${event.icon}" style="color: \${event.color}"></i>
                                <span class="font-bold text-xl">\${event.minute}'</span>
                                <span class="text-secondary">- \${event.team}</span>
                              </div>
                              <div class="card-player-name">
                                <i class="fas fa-user-circle mr-2"></i>\${event.player}
                              </div>
                              <div class="text-sm text-secondary">
                                \${event.card === 'YELLOW_CARD' ? (t('yellowCard') || 'إنذار') : (t('redCard') || 'طرد')}
                              </div>
                            </div>
                          </div>
                        </div>
                      \`;
                    } else if (event.type === 'substitution') {
                      return \`
                        <div class="event-item substitution">
                          <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                              <div class="flex items-center gap-2 mb-2">
                                <i class="fas \${event.icon} text-blue-500"></i>
                                <span class="font-bold text-xl">\${event.minute}'</span>
                                <span class="text-secondary">- \${event.team}</span>
                              </div>
                              <div class="text-sm">
                                <div class="flex items-center gap-2 mb-1">
                                  <i class="fas fa-arrow-down text-red-500"></i>
                                  <span>\${event.playerOut}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                  <i class="fas fa-arrow-up text-green-500"></i>
                                  <span>\${event.playerIn}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      \`;
                    }
                  }).join('')}
                </div>
              </div>
            \`;
          }
        }

        // Statistics
        let statsHtml = '';
        if (isFinished || isLive) {
          const homeGoals = match.score.fullTime.home || 0;
          const awayGoals = match.score.fullTime.away || 0;
          const totalGoals = homeGoals + awayGoals;
          
          const homeCards = match.bookings ? match.bookings.filter(b => b.team.id === match.homeTeam.id).length : 0;
          const awayCards = match.bookings ? match.bookings.filter(b => b.team.id === match.awayTeam.id).length : 0;
          const totalCards = homeCards + awayCards;
          
          statsHtml = \`
            <div class="glass-card p-6 rounded-2xl mb-6">
              <h3 class="text-xl font-bold mb-4">
                <i class="fas fa-chart-bar mr-2"></i>
                \${t('statistics') || 'الإحصائيات'}
              </h3>
              <div class="space-y-6">
                <!-- Goals -->
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span>\${homeGoals}</span>
                    <span class="font-bold">\${t('goals') || 'الأهداف'}</span>
                    <span>\${awayGoals}</span>
                  </div>
                  <div class="stat-bar">
                    <div class="stat-fill" style="width: \${totalGoals > 0 ? (homeGoals / totalGoals * 100) : 50}%"></div>
                  </div>
                </div>
                
                <!-- Cards -->
                \${totalCards > 0 ? \`
                  <div>
                    <div class="flex justify-between text-sm mb-2">
                      <span>\${homeCards}</span>
                      <span class="font-bold">\${t('cards') || 'البطاقات'}</span>
                      <span>\${awayCards}</span>
                    </div>
                    <div class="stat-bar">
                      <div class="stat-fill" style="width: \${homeCards / totalCards * 100}%"></div>
                    </div>
                  </div>
                \` : ''}
              </div>
            </div>
          \`;
        }

        // Lineups
        let lineupsHtml = '';
        if (match.homeTeam.lineup && match.homeTeam.lineup.length > 0) {
          lineupsHtml = \`
            <div class="glass-card p-6 rounded-2xl mb-6">
              <h3 class="text-xl font-bold mb-4">
                <i class="fas fa-users mr-2"></i>
                \${t('lineup') || 'التشكيل'}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Home Team -->
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <img src="\${match.homeTeam.crest}" class="w-6 h-6">
                    <h4 class="font-bold text-lg">\${match.homeTeam.name}</h4>
                    \${match.homeTeam.formation ? \`<span class="text-secondary">(\${match.homeTeam.formation})</span>\` : ''}
                  </div>
                  <div class="space-y-2">
                    \${match.homeTeam.lineup.map(player => \`
                      <div class="lineup-player">
                        <span class="font-bold text-primary mr-2">\${player.shirtNumber || ''}</span>
                        <span>\${player.name}</span>
                        \${player.position ? \`<span class="text-xs text-secondary ml-2">(\${player.position})</span>\` : ''}
                      </div>
                    \`).join('')}
                  </div>
                  
                  \${match.homeTeam.bench && match.homeTeam.bench.length > 0 ? \`
                    <div class="mt-4">
                      <h5 class="font-bold text-sm text-secondary mb-2">\${t('bench') || 'البدلاء'}</h5>
                      <div class="space-y-1">
                        \${match.homeTeam.bench.map(player => \`
                          <div class="text-sm opacity-75">
                            <span class="font-bold text-primary mr-2">\${player.shirtNumber || ''}</span>
                            <span>\${player.name}</span>
                          </div>
                        \`).join('')}
                      </div>
                    </div>
                  \` : ''}
                </div>
                
                <!-- Away Team -->
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <img src="\${match.awayTeam.crest}" class="w-6 h-6">
                    <h4 class="font-bold text-lg">\${match.awayTeam.name}</h4>
                    \${match.awayTeam.formation ? \`<span class="text-secondary">(\${match.awayTeam.formation})</span>\` : ''}
                  </div>
                  <div class="space-y-2">
                    \${match.awayTeam.lineup.map(player => \`
                      <div class="lineup-player">
                        <span class="font-bold text-primary mr-2">\${player.shirtNumber || ''}</span>
                        <span>\${player.name}</span>
                        \${player.position ? \`<span class="text-xs text-secondary ml-2">(\${player.position})</span>\` : ''}
                      </div>
                    \`).join('')}
                  </div>
                  
                  \${match.awayTeam.bench && match.awayTeam.bench.length > 0 ? \`
                    <div class="mt-4">
                      <h5 class="font-bold text-sm text-secondary mb-2">\${t('bench') || 'البدلاء'}</h5>
                      <div class="space-y-1">
                        \${match.awayTeam.bench.map(player => \`
                          <div class="text-sm opacity-75">
                            <span class="font-bold text-primary mr-2">\${player.shirtNumber || ''}</span>
                            <span>\${player.name}</span>
                          </div>
                        \`).join('')}
                      </div>
                    </div>
                  \` : ''}
                </div>
              </div>
            </div>
          \`;
        }

        container.innerHTML = compHtml + teamsHtml + matchInfoHtml + eventsHtml + statsHtml + lineupsHtml;
      }
      
      loadMatchDetails();
      
      // Auto refresh for live matches
      setInterval(() => {
        loadMatchDetails();
      }, 30000);
      
      // Re-render on language change
      window.addEventListener('languageChanged', loadMatchDetails);
    </script>
</body>
</html>
  `)
})


// Competitions page + Mobile Menu
app.get('/competitions', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - البطولات</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader('competitions')}
    
    <div class="container mx-auto px-4 py-6">
        <div class="glass-card p-6 rounded-2xl mb-6">
          <h1 class="text-4xl font-black gradient-text">
            <i class="fas fa-trophy mr-3"></i>
            <span data-translate="competitions">البطولات</span>
          </h1>
        </div>

        <div id="competitions-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="skeleton h-48"></div>
          <div class="skeleton h-48"></div>
          <div class="skeleton h-48"></div>
        </div>
    </div>
    
    <!-- Mobile Menu Bar -->
    <div class="mobile-menu-bar">
      <nav>
        <a href="/" class="mobile-menu-item">
          <i class="fas fa-home"></i>
          <span data-translate="home">الرئيسية</span>
        </a>
        <a href="/matches" class="mobile-menu-item">
          <i class="fas fa-calendar-alt"></i>
          <span data-translate="matches">المباريات</span>
        </a>
        <a href="/competitions" class="mobile-menu-item active">
          <i class="fas fa-trophy"></i>
          <span data-translate="competitions">البطولات</span>
        </a>
      </nav>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      async function loadCompetitions() {
        try {
          const response = await axios.get('/api/competitions');
          const competitions = response.data.competitions;
          const t = window.kooraxT;
          const lang = window.kooraxGetLang();
          
          const container = document.getElementById('competitions-container');
          
          if (competitions.length === 0) {
            container.innerHTML = \`
              <div class="glass-card p-12 text-center rounded-2xl col-span-3">
                <i class="fas fa-trophy text-6xl text-secondary mb-4"></i>
                <p class="text-xl text-secondary" data-translate="noData">\${t('noData')}</p>
              </div>
            \`;
            return;
          }
          
          container.innerHTML = competitions.map(comp => {
            const compInfo = ${JSON.stringify(COMPETITIONS_INFO)}[comp.id] || {};
            const compName = lang === 'ar' ? (compInfo.name || comp.name) : (compInfo.nameEn || comp.name);
            
            return \`
              <a href="/competitions/\${comp.id}" class="glass-card p-6 rounded-2xl hover:scale-105 transition-transform block">
                <div class="flex items-center gap-4 mb-4">
                  \${comp.emblem ? \`<img src="\${comp.emblem}" class="w-16 h-16" onerror="this.style.display='none'">\` : \`<i class="fas fa-trophy text-4xl text-yellow-500"></i>\`}
                  <div class="flex-1">
                    <h3 class="text-xl font-bold">\${compName}</h3>
                    <p class="text-sm text-secondary">\${comp.area?.name || compInfo.country || ''}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-white/10">
                  <span class="text-sm text-secondary">\${compInfo.type === 'cup' ? '🏆 ' + t('competitions') : '🏟️ ' + t('standings')}</span>
                  <i class="fas fa-arrow-left text-primary"></i>
                </div>
              </a>
            \`;
          }).join('');
          
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading competitions:', error);
          const t = window.kooraxT;
          document.getElementById('competitions-container').innerHTML = 
            \`<p class="text-center text-red-500 py-12 col-span-3" data-translate="error">\${t('error')}</p>\`;
        }
      }
      
      loadCompetitions();
      
      window.addEventListener('language-changed', () => {
        loadCompetitions();
      });
    </script>
</body>
</html>
  `);
});

// Competition Details page (Standings + Scorers)
app.get('/competitions/:id', (c) => {
  const compId = c.req.param('id');
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - تفاصيل البطولة</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader('competitions')}
    
    <div class="container mx-auto px-4 py-6">
        <!-- Competition Header -->
        <div id="comp-header" class="glass-card p-6 rounded-2xl mb-6">
          <div class="skeleton h-24"></div>
        </div>

        <!-- Tabs -->
        <div class="glass-card p-2 rounded-2xl mb-6">
          <div class="grid grid-cols-2 gap-2">
            <button onclick="showTab('standings')" class="tab-btn active" data-tab="standings">
              <i class="fas fa-list-ol mr-2"></i>
              <span data-translate="standings">الترتيب</span>
            </button>
            <button onclick="showTab('scorers')" class="tab-btn" data-tab="scorers">
              <i class="fas fa-futbol mr-2"></i>
              <span data-translate="topScorers">الهدافون</span>
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div id="standings-tab" class="tab-content active">
          <div class="skeleton h-96"></div>
        </div>
        
        <div id="scorers-tab" class="tab-content">
          <div class="skeleton h-96"></div>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      const compId = ${compId};
      let currentTab = 'standings';
      
      function showTab(tab) {
        currentTab = tab;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
          }
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(tab + '-tab').classList.add('active');
        
        if (tab === 'standings') {
          loadStandings();
        } else {
          loadScorers();
        }
      }
      
      async function loadCompetitionHeader() {
        try {
          const response = await axios.get('/api/competitions');
          const competitions = response.data.competitions;
          const comp = competitions.find(c => c.id == compId);
          
          if (!comp) return;
          
          const t = window.kooraxT;
          const lang = window.kooraxGetLang();
          const compInfo = ${JSON.stringify(COMPETITIONS_INFO)}[comp.id] || {};
          const compName = lang === 'ar' ? (compInfo.name || comp.name) : (compInfo.nameEn || comp.name);
          
          document.getElementById('comp-header').innerHTML = \`
            <div class="flex items-center gap-4">
              \${comp.emblem ? \`<img src="\${comp.emblem}" class="w-20 h-20" onerror="this.style.display='none'">\` : \`<i class="fas fa-trophy text-5xl text-yellow-500"></i>\`}
              <div class="flex-1">
                <h1 class="text-3xl font-black gradient-text">\${compName}</h1>
                <p class="text-secondary">\${comp.area?.name || compInfo.country || ''}</p>
              </div>
              <a href="/competitions" class="text-primary hover:underline">
                <i class="fas fa-arrow-right mr-2"></i>
                <span data-translate="backToCompetitions">\${t('backToCompetitions')}</span>
              </a>
            </div>
          \`;
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading competition header:', error);
        }
      }
      
      async function loadStandings() {
        try {
          const response = await axios.get(\`/api/competitions/\${compId}/standings\`);
          const standings = response.data.standings;
          const t = window.kooraxT;
          
          const container = document.getElementById('standings-tab');
          
          if (!standings || standings.length === 0) {
            container.innerHTML = \`
              <div class="glass-card p-12 text-center rounded-2xl">
                <i class="fas fa-list-ol text-6xl text-secondary mb-4"></i>
                <p class="text-xl text-secondary" data-translate="noData">\${t('noData')}</p>
              </div>
            \`;
            return;
          }
          
          let html = '';
          standings.forEach(standing => {
            if (standing.table) {
              html += \`
                <div class="glass-card p-6 rounded-2xl mb-6">
                  \${standing.group ? \`<h3 class="text-xl font-bold mb-4">\${standing.group}</h3>\` : ''}
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead>
                        <tr class="border-b border-white/10">
                          <th class="text-right p-3" data-translate="position">\${t('position')}</th>
                          <th class="text-right p-3" data-translate="team">\${t('team')}</th>
                          <th class="text-center p-3" data-translate="played">\${t('played')}</th>
                          <th class="text-center p-3" data-translate="won">\${t('won')}</th>
                          <th class="text-center p-3" data-translate="draw">\${t('draw')}</th>
                          <th class="text-center p-3" data-translate="lost">\${t('lost')}</th>
                          <th class="text-center p-3" data-translate="goalDifference">\${t('goalDifference')}</th>
                          <th class="text-center p-3 font-bold" data-translate="points">\${t('points')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        \${standing.table.map((team, idx) => \`
                          <tr class="border-b border-white/5 hover:bg-white/5 transition">
                            <td class="p-3">
                              <div class="w-8 h-8 rounded-full \${idx < 4 ? 'bg-green-500/20 text-green-500' : idx >= standing.table.length - 3 ? 'bg-red-500/20 text-red-500' : 'bg-white/10'} flex items-center justify-center font-bold text-sm">
                                \${team.position}
                              </div>
                            </td>
                            <td class="p-3">
                              <div class="flex items-center gap-3">
                                <img src="\${team.team.crest}" class="w-8 h-8" onerror="this.style.display='none'">
                                <span class="font-medium">\${team.team.name}</span>
                              </div>
                            </td>
                            <td class="text-center p-3">\${team.playedGames}</td>
                            <td class="text-center p-3">\${team.won}</td>
                            <td class="text-center p-3">\${team.draw}</td>
                            <td class="text-center p-3">\${team.lost}</td>
                            <td class="text-center p-3 \${team.goalDifference > 0 ? 'text-green-500' : team.goalDifference < 0 ? 'text-red-500' : ''}">\${team.goalDifference > 0 ? '+' : ''}\${team.goalDifference}</td>
                            <td class="text-center p-3 font-bold text-primary">\${team.points}</td>
                          </tr>
                        \`).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              \`;
            }
          });
          
          container.innerHTML = html;
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading standings:', error);
          const t = window.kooraxT;
          document.getElementById('standings-tab').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }
      
      async function loadScorers() {
        try {
          const response = await axios.get(\`/api/competitions/\${compId}/scorers\`);
          const scorers = response.data.scorers;
          const t = window.kooraxT;
          
          const container = document.getElementById('scorers-tab');
          
          if (!scorers || scorers.length === 0) {
            container.innerHTML = \`
              <div class="glass-card p-12 text-center rounded-2xl">
                <i class="fas fa-futbol text-6xl text-secondary mb-4"></i>
                <p class="text-xl text-secondary" data-translate="noData">\${t('noData')}</p>
              </div>
            \`;
            return;
          }
          
          container.innerHTML = \`
            <div class="glass-card p-6 rounded-2xl">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-white/10">
                      <th class="text-right p-3">#</th>
                      <th class="text-right p-3" data-translate="player">\${t('player')}</th>
                      <th class="text-right p-3" data-translate="team">\${t('team')}</th>
                      <th class="text-center p-3" data-translate="goals">\${t('goals')}</th>
                      <th class="text-center p-3" data-translate="assists">\${t('assists')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${scorers.map((scorer, idx) => \`
                      <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="p-3">
                          <div class="w-8 h-8 rounded-full \${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-gray-400/20 text-gray-400' : idx === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/10'} flex items-center justify-center font-bold text-sm">
                            \${idx + 1}
                          </div>
                        </td>
                        <td class="p-3">
                          <p class="font-bold">\${scorer.player.name}</p>
                          <p class="text-sm text-secondary">\${scorer.player.nationality || ''}</p>
                        </td>
                        <td class="p-3">
                          <div class="flex items-center gap-2">
                            \${scorer.team.crest ? \`<img src="\${scorer.team.crest}" class="w-6 h-6" onerror="this.style.display='none'">\` : ''}
                            <span>\${scorer.team.name}</span>
                          </div>
                        </td>
                        <td class="text-center p-3">
                          <span class="text-xl font-bold text-primary">\${scorer.goals || scorer.playedMatches || 0}</span>
                        </td>
                        <td class="text-center p-3 text-secondary">\${scorer.assists || '-'}</td>
                      </tr>
                    \`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          \`;
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading scorers:', error);
          const t = window.kooraxT;
          document.getElementById('scorers-tab').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }
      
      loadCompetitionHeader();
      loadStandings();
      
      window.addEventListener('language-changed', () => {
        loadCompetitionHeader();
        if (currentTab === 'standings') {
          loadStandings();
        } else {
          loadScorers();
        }
      });
    </script>
</body>
</html>
  `);
});

// Team Details page
app.get('/teams/:id', (c) => {
  const teamId = c.req.param('id');
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - تفاصيل الفريق</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader()}
    
    <div class="container mx-auto px-4 py-6">
        <div id="team-details-container">
          <div class="skeleton h-96"></div>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      const teamId = ${teamId};
      
      async function loadTeamDetails() {
        try {
          const [teamResponse, matchesResponse] = await Promise.all([
            axios.get(\`/api/teams/\${teamId}\`),
            axios.get(\`/api/teams/\${teamId}/matches\`)
          ]);
          
          const team = teamResponse.data;
          const matches = matchesResponse.data.matches || [];
          const t = window.kooraxT;
          
          const container = document.getElementById('team-details-container');
          
          let html = \`
            <!-- Team Header -->
            <div class="glass-card p-8 rounded-2xl mb-6">
              <div class="flex flex-col md:flex-row items-center gap-6">
                <img src="\${team.crest}" class="w-32 h-32" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
                <div class="flex-1 text-center md:text-right">
                  <h1 class="text-4xl font-black gradient-text mb-2">\${team.name}</h1>
                  <p class="text-xl text-secondary mb-4">\${team.shortName || ''}</p>
                  <div class="flex flex-wrap gap-3 justify-center md:justify-start">
                    \${team.founded ? \`<span class="px-4 py-2 bg-white/10 rounded-full text-sm">📅 \${t('founded')}: \${team.founded}</span>\` : ''}
                    \${team.venue ? \`<span class="px-4 py-2 bg-white/10 rounded-full text-sm">🏟️ \${team.venue}</span>\` : ''}
                    \${team.area?.name ? \`<span class="px-4 py-2 bg-white/10 rounded-full text-sm">🌍 \${team.area.name}</span>\` : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Team Matches -->
            <div class="glass-card p-6 rounded-2xl">
              <h2 class="text-2xl font-bold gradient-text mb-6">
                <i class="fas fa-calendar-alt mr-3"></i>
                <span data-translate="matches">\${t('matches')}</span>
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                \${matches.slice(0, 10).map(match => {
                  const isHome = match.homeTeam.id == teamId;
                  const opponent = isHome ? match.awayTeam : match.homeTeam;
                  const score = match.score.fullTime.home !== null 
                    ? \`\${match.score.fullTime.home} - \${match.score.fullTime.away}\`
                    : new Date(match.utcDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'});
                  
                  const statusBadge = match.status === 'IN_PLAY' || match.status === 'PAUSED'
                    ? \`<span class="status-live">\${t('live')}</span>\`
                    : match.status === 'FINISHED'
                    ? \`<span class="status-finished">\${t('finished')}</span>\`
                    : \`<span class="status-scheduled">\${t('scheduled')}</span>\`;
                  
                  return \`
                    <a href="/matches/\${match.id}" class="match-card block">
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-sm text-secondary">\${match.competition.name}</span>
                        \${statusBadge}
                      </div>
                      <div class="flex items-center justify-between gap-4">
                        <div class="flex items-center gap-2 flex-1">
                          <img src="\${opponent.crest}" class="w-10 h-10" onerror="this.style.display='none'">
                          <span class="font-bold truncate">\${isHome ? 'vs' : '@'} \${opponent.name}</span>
                        </div>
                        <div class="text-center px-4">
                          <div class="text-lg font-bold">\${score}</div>
                        </div>
                      </div>
                    </a>
                  \`;
                }).join('')}
              </div>
            </div>
          \`;
          
          container.innerHTML = html;
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading team details:', error);
          const t = window.kooraxT;
          document.getElementById('team-details-container').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }
      
      loadTeamDetails();
      
      window.addEventListener('language-changed', () => {
        loadTeamDetails();
      });
    </script>
</body>
</html>
  `);
});



// Standalone Quiz Page - فزورة كوراكس (Complete with Header, Login, etc.)
app.get('/quiz', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - فزورة كوراكس</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader('quiz')}
    
    <div class="container mx-auto px-4 py-6">
        <!-- Login Required Message -->
        <div id="login-required-section" style="display: none;">
          <div class="glass-card p-8 rounded-2xl text-center max-w-md mx-auto">
            <i class="fas fa-lock text-6xl gradient-text mb-6"></i>
            <h2 class="text-3xl font-black gradient-text mb-4">تسجيل الدخول مطلوب</h2>
            <p class="text-gray-400 mb-6">يجب عليك تسجيل الدخول أو إنشاء حساب للمشاركة في الفزورة اليومية</p>
            <div class="flex gap-4 justify-center">
              <button onclick="showRegisterModal()" class="btn-primary">
                <i class="fas fa-user-plus"></i>
                إنشاء حساب
              </button>
              <button onclick="showLoginModal()" class="btn-secondary">
                <i class="fas fa-sign-in-alt"></i>
                تسجيل دخول
              </button>
            </div>
          </div>
        </div>

        <!-- Quiz Section (for logged-in users) -->
        <div id="quiz-section" style="display: none;">
          <!-- Daily Quiz Card -->
          <div class="glass-card p-6 rounded-2xl mb-6">
            <div class="flex items-center gap-3 mb-6">
              <i class="fas fa-calendar-day text-3xl gradient-text"></i>
              <h2 class="text-3xl font-black gradient-text">فزورة اليوم</h2>
            </div>
            
            <div id="quiz-content">
              <!-- Question -->
              <div id="question-card" class="mb-6">
                <h3 class="text-xl font-bold mb-4" id="question-text">جاري تحميل السؤال...</h3>
                
                <!-- Options -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="options-container">
                  <!-- Options will be inserted here -->
                </div>
              </div>
              
              <!-- Result Message -->
              <div id="result-message" style="display: none;" class="p-4 rounded-xl text-center"></div>
            </div>
          </div>

          <!-- Weekly Leaderboard -->
          <div class="glass-card p-6 rounded-2xl">
            <div class="flex items-center gap-3 mb-6">
              <i class="fas fa-trophy text-3xl gradient-text"></i>
              <h2 class="text-3xl font-black gradient-text">المتصدرون هذا الأسبوع</h2>
            </div>
            
            <div id="leaderboard-container">
              <!-- Leaderboard will be inserted here -->
            </div>
          </div>
        </div>

        <!-- Admin Dashboard (only for admin) -->
        <div id="admin-section" style="display: none;">
          <div class="glass-card p-6 rounded-2xl mb-6">
            <div class="flex items-center gap-3 mb-6">
              <i class="fas fa-user-shield text-3xl gradient-text"></i>
              <h2 class="text-3xl font-black gradient-text">لوحة تحكم الأدمن</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <!-- Stats Cards -->
              <div class="glass-card p-4 rounded-xl">
                <div class="flex items-center gap-3">
                  <i class="fas fa-users text-2xl text-blue-500"></i>
                  <div>
                    <p class="text-gray-400 text-sm">إجمالي المتسابقين</p>
                    <p class="text-2xl font-bold" id="total-users">0</p>
                  </div>
                </div>
              </div>
              
              <div class="glass-card p-4 rounded-xl">
                <div class="flex items-center gap-3">
                  <i class="fas fa-question-circle text-2xl text-green-500"></i>
                  <div>
                    <p class="text-gray-400 text-sm">إجمالي الأسئلة</p>
                    <p class="text-2xl font-bold" id="total-questions">0</p>
                  </div>
                </div>
              </div>
              
              <div class="glass-card p-4 rounded-xl">
                <div class="flex items-center gap-3">
                  <i class="fas fa-check-circle text-2xl text-purple-500"></i>
                  <div>
                    <p class="text-gray-400 text-sm">إجابات اليوم</p>
                    <p class="text-2xl font-bold" id="today-answers">0</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Participants Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-right">
                <thead>
                  <tr class="border-b border-gray-700">
                    <th class="p-3">الاسم</th>
                    <th class="p-3">البريد الإلكتروني</th>
                    <th class="p-3">النقاط</th>
                    <th class="p-3">تاريخ التسجيل</th>
                    <th class="p-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody id="participants-table">
                  <!-- Participants will be inserted here -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add Question Form -->
          <div class="glass-card p-6 rounded-2xl">
            <h3 class="text-2xl font-black gradient-text mb-4">
              <i class="fas fa-plus-circle"></i>
              إضافة سؤال جديد
            </h3>
            
            <form id="add-question-form" class="space-y-4">
              <div>
                <label class="block mb-2 font-semibold">نص السؤال</label>
                <textarea id="question-input" class="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none" rows="3" required></textarea>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block mb-2 font-semibold">الخيار A</label>
                  <input type="text" id="option-a" class="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none" required>
                </div>
                <div>
                  <label class="block mb-2 font-semibold">الخيار B</label>
                  <input type="text" id="option-b" class="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none" required>
                </div>
                <div>
                  <label class="block mb-2 font-semibold">الخيار C</label>
                  <input type="text" id="option-c" class="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none" required>
                </div>
                <div>
                  <label class="block mb-2 font-semibold">الخيار D</label>
                  <input type="text" id="option-d" class="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none" required>
                </div>
              </div>
              
              <div>
                <label class="block mb-2 font-semibold">الإجابة الصحيحة</label>
                <select id="correct-answer" class="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none" required>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              
              <button type="submit" class="btn-primary w-full">
                <i class="fas fa-save"></i>
                حفظ السؤال
              </button>
            </form>
          </div>
        </div>
    </div>

    <!-- Register Modal -->
    <div id="register-modal" class="login-modal">
      <div class="login-modal-content">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-black gradient-text">
            <i class="fas fa-user-plus"></i>
            إنشاء حساب جديد
          </h2>
          <button onclick="closeRegisterModal()" class="text-white text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="register-form" class="space-y-4">
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-user"></i>
              الاسم الكامل
            </label>
            <input type="text" id="register-name" class="form-input" placeholder="أدخل اسمك الكامل" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-envelope"></i>
              البريد الإلكتروني
            </label>
            <input type="email" id="register-email" class="form-input" placeholder="your@email.com" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-lock"></i>
              كلمة المرور
            </label>
            <input type="password" id="register-password" class="form-input" placeholder="أدخل كلمة مرور قوية" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-lock"></i>
              تأكيد كلمة المرور
            </label>
            <input type="password" id="register-confirm-password" class="form-input" placeholder="أعد إدخال كلمة المرور" required>
          </div>
          
          <div id="register-error" class="error-message" style="display: none;"></div>
          <div id="register-success" class="success-message" style="display: none;"></div>
          
          <button type="submit" class="btn-primary w-full">
            <i class="fas fa-user-plus"></i>
            إنشاء حساب
          </button>
          
          <p class="text-center text-gray-400">
            لديك حساب بالفعل؟
            <button type="button" onclick="closeRegisterModal(); showLoginModal();" class="text-purple-500 hover:text-purple-400">
              تسجيل دخول
            </button>
          </p>
        </form>
      </div>
    </div>

    <!-- Login Modal -->
    <div id="login-modal-quiz" class="login-modal">
      <div class="login-modal-content">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-black gradient-text">
            <i class="fas fa-sign-in-alt"></i>
            تسجيل دخول
          </h2>
          <button onclick="closeLoginModal()" class="text-white text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="login-form-quiz" class="space-y-4">
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-envelope"></i>
              البريد الإلكتروني
            </label>
            <input type="email" id="login-email-quiz" class="form-input" placeholder="your@email.com" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-lock"></i>
              كلمة المرور
            </label>
            <input type="password" id="login-password-quiz" class="form-input" placeholder="أدخل كلمة المرور" required>
          </div>
          
          <div id="login-error-quiz" class="error-message" style="display: none;"></div>
          
          <button type="submit" class="btn-primary w-full">
            <i class="fas fa-sign-in-alt"></i>
            تسجيل دخول
          </button>
          
          <p class="text-center text-gray-400">
            ليس لديك حساب؟
            <button type="button" onclick="closeLoginModal(); showRegisterModal();" class="text-purple-500 hover:text-purple-400">
              إنشاء حساب
            </button>
          </p>
        </form>
      </div>
    </div>

    <script src="/static/koorax-features.js"></script>
    <script>
    // Constants
    const ADMIN_EMAIL = 'TN@gmail.com';
    const ADMIN_PASSWORD = 'K00R@X';

    // Mock Data
    const mockQuestion = {
      id: 1,
      question: 'من هو الفريق الذي فاز بدوري أبطال أوروبا في موسم 2022-2023؟',
      options: {
        A: 'ريال مدريد',
        B: 'مانشستر سيتي',
        C: 'إنتر ميلان',
        D: 'بايرن ميونخ'
      },
      correctAnswer: 'B',
      date: new Date().toISOString().split('T')[0]
    };

    const mockLeaderboard = [
      { rank: 1, name: 'أحمد محمد', points: 150 },
      { rank: 2, name: 'محمد علي', points: 140 },
      { rank: 3, name: 'فاطمة أحمد', points: 130 },
      { rank: 4, name: 'سارة محمود', points: 120 },
      { rank: 5, name: 'عمر خالد', points: 110 }
    ];

    const mockParticipants = [
      { id: 1, name: 'أحمد محمد', email: 'ahmed@example.com', points: 150, joinedAt: '2024-01-15' },
      { id: 2, name: 'محمد علي', email: 'mohamed@example.com', points: 140, joinedAt: '2024-01-16' },
      { id: 3, name: 'فاطمة أحمد', email: 'fatma@example.com', points: 130, joinedAt: '2024-01-17' }
    ];

    // Check authentication
    function checkAuth() {
      const user = localStorage.getItem('koorax_quiz_user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          showQuizContent(userData);
        } catch (error) {
          showLoginRequired();
        }
      } else {
        showLoginRequired();
      }
    }

    // Show login required message
    function showLoginRequired() {
      document.getElementById('login-required-section').style.display = 'block';
      document.getElementById('quiz-section').style.display = 'none';
      document.getElementById('admin-section').style.display = 'none';
    }

    // Show quiz content
    function showQuizContent(userData) {
      document.getElementById('login-required-section').style.display = 'none';
      
      // Check if admin
      if (userData.email === ADMIN_EMAIL) {
        document.getElementById('quiz-section').style.display = 'block';
        document.getElementById('admin-section').style.display = 'block';
        loadAdminDashboard();
      } else {
        document.getElementById('quiz-section').style.display = 'block';
        document.getElementById('admin-section').style.display = 'none';
      }
      
      loadQuizQuestion();
      loadLeaderboard();
    }

    // Load quiz question
    function loadQuizQuestion() {
      // TODO: Replace with API call
      document.getElementById('question-text').textContent = mockQuestion.question;
      
      const optionsHtml = Object.entries(mockQuestion.options).map(([key, value]) => \`
        <button onclick="submitAnswer('\${key}')" class="quiz-option p-4 rounded-xl bg-gray-800 hover:bg-purple-600 transition-all text-right border-2 border-gray-700 hover:border-purple-500">
          <span class="font-bold">\${key})</span> \${value}
        </button>
      \`).join('');
      
      document.getElementById('options-container').innerHTML = optionsHtml;
    }

    // Submit answer
    function submitAnswer(answer) {
      // TODO: Replace with API call
      const resultDiv = document.getElementById('result-message');
      const isCorrect = answer === mockQuestion.correctAnswer;
      
      // Disable all options
      document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      });
      
      if (isCorrect) {
        resultDiv.className = 'success-message';
        resultDiv.innerHTML = '<i class="fas fa-check-circle"></i> 🎉 إجابة صحيحة! حصلت على 10 نقاط';
      } else {
        resultDiv.className = 'error-message';
        resultDiv.innerHTML = '<i class="fas fa-times-circle"></i> ❌ إجابة خاطئة. الإجابة الصحيحة: ' + mockQuestion.correctAnswer + ') ' + mockQuestion.options[mockQuestion.correctAnswer];
      }
      
      resultDiv.style.display = 'block';
    }

    // Load leaderboard
    function loadLeaderboard() {
      // TODO: Replace with API call
      const leaderboardHtml = mockLeaderboard.map(user => {
        let icon = '';
        let colorClass = '';
        
        if (user.rank === 1) {
          icon = '<i class="fas fa-trophy text-yellow-400"></i>';
          colorClass = 'bg-yellow-900 bg-opacity-20';
        } else if (user.rank === 2) {
          icon = '<i class="fas fa-medal text-gray-400"></i>';
          colorClass = 'bg-gray-700 bg-opacity-20';
        } else if (user.rank === 3) {
          icon = '<i class="fas fa-medal text-orange-400"></i>';
          colorClass = 'bg-orange-900 bg-opacity-20';
        }
        
        return \`
          <div class="flex items-center justify-between p-4 rounded-xl \${colorClass} mb-2 hover:bg-opacity-30 transition-all">
            <div class="flex items-center gap-4">
              <span class="text-2xl font-bold w-8">\${user.rank}</span>
              \${icon}
              <span class="font-semibold">\${user.name}</span>
            </div>
            <span class="text-xl font-bold gradient-text">\${user.points} نقطة</span>
          </div>
        \`;
      }).join('');
      
      document.getElementById('leaderboard-container').innerHTML = leaderboardHtml;
    }

    // Load admin dashboard
    function loadAdminDashboard() {
      // TODO: Replace with API calls
      document.getElementById('total-users').textContent = mockParticipants.length;
      document.getElementById('total-questions').textContent = '50';
      document.getElementById('today-answers').textContent = '25';
      
      const participantsHtml = mockParticipants.map(user => \`
        <tr class="border-b border-gray-700 hover:bg-gray-800">
          <td class="p-3">\${user.name}</td>
          <td class="p-3">\${user.email}</td>
          <td class="p-3 font-bold text-purple-500">\${user.points}</td>
          <td class="p-3">\${user.joinedAt}</td>
          <td class="p-3">
            <button onclick="deleteUser(\${user.id})" class="text-red-500 hover:text-red-400">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      \`).join('');
      
      document.getElementById('participants-table').innerHTML = participantsHtml;
    }

    // Delete user (admin only)
    function deleteUser(userId) {
      if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        // TODO: Replace with API call
        alert('تم حذف المستخدم');
        loadAdminDashboard();
      }
    }

    // Show/hide modals
    function showRegisterModal() {
      document.getElementById('register-modal').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeRegisterModal() {
      document.getElementById('register-modal').classList.remove('active');
      document.body.style.overflow = '';
    }

    function showLoginModal() {
      document.getElementById('login-modal-quiz').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLoginModal() {
      document.getElementById('login-modal-quiz').classList.remove('active');
      document.body.style.overflow = '';
    }

    // Register form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;
      
      const errorDiv = document.getElementById('register-error');
      const successDiv = document.getElementById('register-success');
      
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      
      // Validation
      if (password !== confirmPassword) {
        errorDiv.textContent = 'كلمة المرور غير متطابقة';
        errorDiv.style.display = 'block';
        return;
      }
      
      if (password.length < 6) {
        errorDiv.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        errorDiv.style.display = 'block';
        return;
      }
      
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store user data
      const userData = {
        name,
        email,
        points: 0,
        joinedAt: new Date().toISOString(),
        isAdmin: email === ADMIN_EMAIL
      };
      
      localStorage.setItem('koorax_quiz_user', JSON.stringify(userData));
      
      successDiv.textContent = '✅ تم إنشاء الحساب بنجاح! جاري تحويلك...';
      successDiv.style.display = 'block';
      
      setTimeout(() => {
        closeRegisterModal();
        window.location.reload();
      }, 1500);
    });

    // Login form
    document.getElementById('login-form-quiz').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email-quiz').value;
      const password = document.getElementById('login-password-quiz').value;
      
      const errorDiv = document.getElementById('login-error-quiz');
      errorDiv.style.display = 'none';
      
      // TODO: Replace with actual API call
      // Check admin credentials
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const userData = {
          name: 'Admin',
          email: ADMIN_EMAIL,
          points: 0,
          joinedAt: new Date().toISOString(),
          isAdmin: true
        };
        
        localStorage.setItem('koorax_quiz_user', JSON.stringify(userData));
        window.location.reload();
        return;
      }
      
      // Simulate regular user login
      // In production, verify credentials with backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        name: email.split('@')[0],
        email,
        points: 0,
        joinedAt: new Date().toISOString(),
        isAdmin: false
      };
      
      localStorage.setItem('koorax_quiz_user', JSON.stringify(userData));
      window.location.reload();
    });

    // Add question form (admin only)
    document.getElementById('add-question-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const questionData = {
        question: document.getElementById('question-input').value,
        options: {
          A: document.getElementById('option-a').value,
          B: document.getElementById('option-b').value,
          C: document.getElementById('option-c').value,
          D: document.getElementById('option-d').value
        },
        correctAnswer: document.getElementById('correct-answer').value
      };
      
      // TODO: Replace with API call
      alert('تم إضافة السؤال بنجاح!');
      e.target.reset();
    });

    // Initialize
    checkAuth();
    </script>
</body>
</html>
  `);
});


export default app;
