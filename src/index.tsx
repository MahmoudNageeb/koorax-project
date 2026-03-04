import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { 
  getCompetitions, 
  getMatches, 
  getMatchById,
  getStandings, 
  getTopScorers,
  getTeamById,
  getTeamMatches,
  getMatchesByDateRange,
  getPlayerById,
  getCurrentMatchdayMatches,
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

// ===== AUTHENTICATION APIs (using Web Crypto API) =====

// Helper: Hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Helper: Generate simple token
function generateToken(userId: number, email: string, isAdmin: boolean = false): string {
  const payload = JSON.stringify({ userId, email, isAdmin, timestamp: Date.now() });
  return btoa(payload);
}

// Helper: Verify token
function verifyToken(token: string): { userId: number; email: string; isAdmin?: boolean } | null {
  try {
    const payload = JSON.parse(atob(token));
    // Simple validation: check if token is not too old (24 hours)
    if (Date.now() - payload.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    return { userId: payload.userId, email: payload.email, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}

// Helper: Generate SEO meta tags
function getSEOTags(page: {
  title: string;
  description: string;
  keywords: string;
  url: string;
  image?: string;
  type?: string;
}) {
  const defaultImage = 'https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai/static/koorax-og-image.png';
  const siteName = 'Koorax - كوراكس';
  
  return `
    <!-- Primary Meta Tags -->
    <meta name="title" content="${page.title}">
    <meta name="description" content="${page.description}">
    <meta name="keywords" content="${page.keywords}">
    <meta name="author" content="Koorax Team">
    <meta name="robots" content="index, follow">
    <meta name="language" content="Arabic">
    <meta name="revisit-after" content="1 days">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${page.type || 'website'}">
    <meta property="og:url" content="${page.url}">
    <meta property="og:title" content="${page.title}">
    <meta property="og:description" content="${page.description}">
    <meta property="og:image" content="${page.image || defaultImage}">
    <meta property="og:site_name" content="${siteName}">
    <meta property="og:locale" content="ar_EG">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${page.url}">
    <meta property="twitter:title" content="${page.title}">
    <meta property="twitter:description" content="${page.description}">
    <meta property="twitter:image" content="${page.image || defaultImage}">
    
    <!-- Additional Meta Tags -->
    <meta name="theme-color" content="#22c55e">
    <meta name="msapplication-TileColor" content="#22c55e">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="canonical" href="${page.url}">
  `;
}

// Helper: Generate JSON-LD Schema
function getSchemaOrg(type: 'WebSite' | 'Quiz' | 'ProfilePage' | 'SportsEvent') {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': type,
    name: 'Koorax - كوراكس',
    url: 'https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai',
    description: 'منصة فزورة كرة القدم اليومية - اختبر معلوماتك في كرة القدم واربح النقاط',
    inLanguage: 'ar',
  };
  
  if (type === 'WebSite') {
    return JSON.stringify({
      ...baseSchema,
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    });
  }
  
  if (type === 'Quiz') {
    return JSON.stringify({
      ...baseSchema,
      '@type': 'Quiz',
      about: {
        '@type': 'Thing',
        name: 'Football'
      },
      educationalLevel: 'Beginner to Expert',
      timeRequired: 'PT1M'
    });
  }
  
  return JSON.stringify(baseSchema);
}


// Register
app.post('/api/auth/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json();
    
    if (!name || !email || !password) {
      return c.json({ error: 'جميع الحقول مطلوبة' }, 400);
    }
    
    if (password.length < 6) {
      return c.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, 400);
    }
    
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: 'البريد الإلكتروني مسجل بالفعل' }, 400);
    }
    
    const passwordHash = await hashPassword(password);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create user with email already verified (auto-verification)
    await c.env.DB.prepare("INSERT INTO users (name, email, password_hash, verification_token, email_verified) VALUES (?, ?, ?, ?, 1)").bind(name, email, passwordHash, verificationCode).run();
    
    console.log(`User ${email} registered successfully`);
    
    return c.json({ 
      success: true, 
      message: 'تم إنشاء الحساب بنجاح'
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return c.json({ error: 'حدث خطأ أثناء التسجيل' }, 500);
  }
});

// Verify email
app.get('/api/auth/verify-email', async (c) => {
  try {
    const email = c.req.query('email');
    const code = c.req.query('code');
    
    if (!email || !code) {
      return c.json({ error: 'البيانات غير كاملة' }, 400);
    }
    
    const user = await c.env.DB.prepare(
      'SELECT id, verification_token FROM users WHERE email = ? AND email_verified = 0'
    ).bind(email).first() as any;
    
    if (!user) {
      return c.json({ error: 'المستخدم غير موجود أو تم التأكيد مسبقاً' }, 404);
    }
    
    if (user.verification_token !== code) {
      return c.json({ error: 'رمز التأكيد غير صحيح' }, 400);
    }
    
    await c.env.DB.prepare(
      'UPDATE users SET email_verified = 1 WHERE id = ?'
    ).bind(user.id).run();
    
    return c.json({ success: true, message: 'تم تأكيد البريد بنجاح' });
  } catch (error: any) {
    console.error('Verify email error:', error);
    return c.json({ error: 'حدث خطأ أثناء التأكيد' }, 500);
  }
});

// Login
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, 400);
    }
    
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first() as any;
    
    if (!user) {
      return c.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401);
    }
    
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      return c.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401);
    }
    
    if (user.email_verified !== 1) {
      return c.json({ error: 'يجب تأكيد البريد الإلكتروني أولاً' }, 403);
    }
    
    const token = generateToken(user.id, user.email, user.is_admin === 1);
    
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points || 0,
        is_admin: user.is_admin || 0
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, 500);
  }
});

// Get current user
app.get('/api/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'يجب تسجيل الدخول' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return c.json({ error: 'توكن غير صحيح' }, 401);
    }
    
    const user = await c.env.DB.prepare(
      'SELECT id, name, email, points, is_admin FROM users WHERE id = ?'
    ).bind(decoded.userId).first() as any;
    
    if (!user) {
      return c.json({ error: 'المستخدم غير موجود' }, 404);
    }
    
    return c.json({ user });
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ error: 'حدث خطأ' }, 500);
  }
});


// ===== FOOTBALL APIs =====

// Get competitions
app.get('/api/competitions', async (c) => {
  try {
    const competitions = await getCompetitions(c.env.FOOTBALL_API_TOKEN);
    return c.json(competitions);
  } catch (error) {
    console.error('Competitions error:', error);
    return c.json({ error: 'Failed to fetch competitions' }, 500);
  }
});

// ===== QUIZ APIs =====

// Get today's question
app.get('/api/quiz/today', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const question = await c.env.DB.prepare("SELECT id, question_text, options, correct_answer FROM quiz_questions ORDER BY id DESC LIMIT 1").first();
    
    if (!question) {
      return c.json({ error: 'لا يوجد سؤال متاح حالياً' }, 404);
    }
    
    // Parse options if stored as JSON string
    let options;
    if (typeof question.options === 'string') {
      try {
        options = JSON.parse(question.options);
      } catch (e) {
        options = question.options;
      }
    } else {
      options = question.options;
    }
    
    // Check if user already answered (if authenticated)
    const authHeader = c.req.header('Authorization');
    let alreadyAnswered = false;
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        const answer = await c.env.DB.prepare("SELECT id FROM user_answers WHERE user_id = ? AND question_id = ?").bind(decoded.userId, question.id).first();
        
        alreadyAnswered = !!answer;
      } catch (e) {
        // Invalid token, ignore
      }
    }
    
    return c.json({
      id: question.id,
      question: question.question_text,
      options: options,
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
    const decoded = verifyToken(token);
    
    const { questionId, answer } = await c.req.json();
    
    // Convert answer to uppercase and validate
    const answerUpper = answer?.toUpperCase();
    if (!questionId || !answerUpper || !['A', 'B', 'C', 'D'].includes(answerUpper)) {
      return c.json({ error: 'بيانات غير صالحة' }, 400);
    }
    
    // Get question
    const question = await c.env.DB.prepare("SELECT id, correct_answer FROM quiz_questions WHERE id = ?").bind(questionId).first();
    
    if (!question) {
      return c.json({ error: 'السؤال غير موجود' }, 404);
    }
    
    // Check if already answered
    const existing = await c.env.DB.prepare("SELECT id FROM user_answers WHERE user_id = ? AND question_id = ?").bind(decoded.userId, questionId).first();
    
    if (existing) {
      return c.json({ error: 'لقد أجبت على هذا السؤال مسبقاً' }, 400);
    }
    
    // Check answer
    const isCorrect = answerUpper === question.correct_answer.toUpperCase();
    const pointsEarned = isCorrect ? 10 : 0;
    
    // Save answer
    await c.env.DB.prepare("INSERT INTO user_answers (user_id, question_id, answer, is_correct, points_earned) VALUES (?, ?, ?, ?, ?)").bind(decoded.userId, questionId, answerUpper, isCorrect ? 1 : 0, pointsEarned).run();
    
    // Update user points
    if (isCorrect) {
      await c.env.DB.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(pointsEarned, decoded.userId).run();
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

// Deduct points for leaving without answering
app.post('/api/quiz/leave-penalty', async (c) => {
  try {
    // Try to get token from Authorization header or body
    let token = null;
    const authHeader = c.req.header('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // For sendBeacon requests, token might be in body
      const body = await c.req.json();
      token = body.token;
    }
    
    if (!token) {
      return c.json({ error: 'يجب تسجيل الدخول' }, 401);
    }
    
    const decoded = verifyToken(token);
    
    const body = await c.req.json();
    const { questionId } = body;
    
    if (!questionId) {
      return c.json({ error: 'بيانات غير صالحة' }, 400);
    }
    
    // Check if already answered
    const existing = await c.env.DB.prepare("SELECT id FROM user_answers WHERE user_id = ? AND question_id = ?").bind(decoded.userId, questionId).first();
    
    if (existing) {
      // Already answered, no penalty
      return c.json({ success: true, message: 'تم الإجابة مسبقاً' });
    }
    
    // Get current points
    const user = await c.env.DB.prepare("SELECT points FROM users WHERE id = ?").bind(decoded.userId).first();
    
    if (!user) {
      return c.json({ error: 'المستخدم غير موجود' }, 404);
    }
    
    // Deduct 5 points (minimum 0)
    const newPoints = Math.max(0, user.points - 5);
    
    await c.env.DB.prepare("UPDATE users SET points = ? WHERE id = ?").bind(newPoints, decoded.userId).run();
    
    // Record the penalty in user_answers
    await c.env.DB.prepare("INSERT INTO user_answers (user_id, question_id, answer, is_correct, points_earned) VALUES (?, ?, 'LEFT', 0, -5)").bind(decoded.userId, questionId).run();
    
    return c.json({
      success: true,
      message: 'تم خصم 5 نقاط للمغادرة',
      pointsDeducted: 5,
      newPoints: newPoints
    });
    
  } catch (error) {
    console.error('Leave penalty error:', error);
    return c.json({ error: 'حدث خطأ أثناء تطبيق العقوبة' }, 500);
  }
});

// Get leaderboard
app.get('/api/quiz/leaderboard', async (c) => {
  try {
    const result = await c.env.DB.prepare("SELECT u.id, u.name, u.points, COUNT(CASE WHEN ua.is_correct = 1 THEN 1 END) as correct_answers, COUNT(ua.id) as total_answers FROM users u LEFT JOIN user_answers ua ON u.id = ua.user_id WHERE u.email_verified = 1 AND u.is_admin = 0 GROUP BY u.id ORDER BY u.points DESC, correct_answers DESC LIMIT 10").all();
    
    const leaderboard = result.results.map((user: any, index: number) => ({
      rank: index + 1,
      name: user.name,
      points: user.points,
      correctAnswers: user.correct_answers,
      totalAnswers: user.total_answers
    }));
    
    return c.json({ leaderboard });
    
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return c.json({ error: 'حدث خطأ أثناء جلب لوحة المتصدرين' }, 500);
  }
});

// Get user profile
app.get('/api/user/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'يجب تسجيل الدخول' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Get user info
    const user = await c.env.DB.prepare("SELECT id, name, email, points, created_at FROM users WHERE id = ?").bind(decoded.userId).first();
    
    if (!user) {
      return c.json({ error: 'المستخدم غير موجود' }, 404);
    }
    
    // Get user rank
    const rankResult = await c.env.DB.prepare("SELECT COUNT(*) + 1 as rank FROM users WHERE points > ? AND is_admin = 0").bind(user.points).first();
    
    // Get answer statistics
    const stats = await c.env.DB.prepare("SELECT COUNT(*) as total, COUNT(CASE WHEN is_correct = 1 THEN 1 END) as correct FROM user_answers WHERE user_id = ?").bind(decoded.userId).first();
    
    // Get recent answers with questions
    const recentAnswers = await c.env.DB.prepare("SELECT ua.answer, ua.is_correct, ua.points_earned, ua.answered_at, q.question_text FROM user_answers ua JOIN quiz_questions q ON ua.question_id = q.id WHERE ua.user_id = ? ORDER BY ua.answered_at DESC LIMIT 10").bind(decoded.userId).all();
    
    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
        rank: rankResult?.rank || 0,
        joinedAt: user.created_at
      },
      stats: {
        totalAnswers: stats?.total || 0,
        correctAnswers: stats?.correct || 0,
        wrongAnswers: (stats?.total || 0) - (stats?.correct || 0),
        successRate: stats?.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      },
      recentAnswers: recentAnswers.results
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'حدث خطأ أثناء جلب الملف الشخصي' }, 500);
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
    const decoded = verifyToken(token);
    
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
      FROM user_answers 
      WHERE DATE(answered_at/1000, 'unixepoch') = ?
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
    const decoded = verifyToken(token);
    
    if (!decoded.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const result = await c.env.DB.prepare(`
      SELECT id, name, email, points, email_verified, created_at
      FROM users 
      WHERE is_admin = 0
      ORDER BY created_at DESC
    `).all();
    
    return c.json({ users: result.results });
    
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
    const decoded = verifyToken(token);
    
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

// Update user points (admin only)
app.put('/api/admin/users/:id/points', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const userId = parseInt(c.req.param('id'));
    const { points } = await c.req.json();
    
    if (typeof points !== 'number' || points < 0) {
      return c.json({ error: 'النقاط يجب أن تكون رقم صحيح موجب' }, 400);
    }
    
    await c.env.DB.prepare("UPDATE users SET points = ? WHERE id = ?").bind(points, userId).run();
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error('Update points error:', error);
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
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const { question_text, options, correct_answer } = await c.req.json();
    
    if (!question_text || !options || !correct_answer) {
      return c.json({ error: 'جميع الحقول مطلوبة' }, 400);
    }
    
    if (!['a', 'b', 'c', 'd'].includes(correct_answer.toLowerCase())) {
      return c.json({ error: 'الإجابة الصحيحة يجب أن تكون a أو b أو c أو d' }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO quiz_questions (question_text, options, correct_answer)
      VALUES (?, ?, ?)
    `).bind(question_text, JSON.stringify(options), correct_answer.toLowerCase()).run();
    
    return c.json({ 
      success: true, 
      questionId: result.meta.last_row_id 
    });
    
  } catch (error: any) {
    console.error('Add question error:', error);
    return c.json({ error: 'حدث خطأ أثناء إضافة السؤال' }, 500);
  }
});

// Get all questions (admin only)
app.get('/api/admin/questions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded?.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const questions = await c.env.DB.prepare("SELECT id, question_text, options, correct_answer, created_at FROM quiz_questions ORDER BY id DESC").all();
    
    return c.json({ questions: questions.results });
    
  } catch (error) {
    console.error('Get questions error:', error);
    return c.json({ error: 'حدث خطأ أثناء جلب الأسئلة' }, 500);
  }
});

// Update question (admin only)
app.put('/api/admin/questions/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded?.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const questionId = parseInt(c.req.param('id'));
    const { question_text, options, correct_answer } = await c.req.json();
    
    if (!question_text || !options || !correct_answer) {
      return c.json({ error: 'جميع الحقول مطلوبة' }, 400);
    }
    
    await c.env.DB.prepare("UPDATE quiz_questions SET question_text = ?, options = ?, correct_answer = ? WHERE id = ?").bind(question_text, JSON.stringify(options), correct_answer.toLowerCase(), questionId).run();
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error('Update question error:', error);
    return c.json({ error: 'حدث خطأ أثناء تحديث السؤال' }, 500);
  }
});

// Delete question (admin only)
app.delete('/api/admin/questions/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded?.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    const questionId = parseInt(c.req.param('id'));
    
    // Delete related answers first
    await c.env.DB.prepare("DELETE FROM user_answers WHERE question_id = ?").bind(questionId).run();
    
    // Delete the question
    await c.env.DB.prepare("DELETE FROM quiz_questions WHERE id = ?").bind(questionId).run();
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error('Delete question error:', error);
    return c.json({ error: 'حدث خطأ أثناء حذف السؤال' }, 500);
  }
});

// Get analytics (admin only)
app.get('/api/admin/analytics', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'غير مصرح' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.isAdmin) {
      return c.json({ error: 'غير مصرح للوصول' }, 403);
    }
    
    // Get success rate
    const totalAnswers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_answers
    `).first();
    
    const correctAnswers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_answers WHERE is_correct = 1
    `).first();
    
    const wrongAnswers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_answers WHERE is_correct = 0
    `).first();
    
    // Get top participants
    const topParticipants = await c.env.DB.prepare(`
      SELECT name, points FROM users 
      WHERE is_admin = 0 
      ORDER BY points DESC 
      LIMIT 5
    `).all();
    
    // Get active today
    const today = new Date().toISOString().split('T')[0];
    const activeToday = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_answers 
      WHERE DATE(answered_at/1000, 'unixepoch') = ?
    `).bind(today).first();
    
    // Get average points
    const avgPoints = await c.env.DB.prepare(`
      SELECT AVG(points) as avg FROM users WHERE is_admin = 0
    `).first();
    
    // Get participation rate
    const totalUsers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE is_admin = 0
    `).first();
    
    const participationRate = totalUsers.count > 0 
      ? Math.round((activeToday.count / totalUsers.count) * 100) 
      : 0;
    
    // Get new users (registered today)
    const newUsers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE DATE(created_at, 'unixepoch') = ? AND is_admin = 0
    `).bind(today).first();
    
    return c.json({
      totalAnswers: totalAnswers.count || 0,
      correctAnswers: correctAnswers.count || 0,
      wrongAnswers: wrongAnswers.count || 0,
      correctPercent: totalAnswers.count > 0 
        ? Math.round((correctAnswers.count / totalAnswers.count) * 100) 
        : 0,
      wrongPercent: totalAnswers.count > 0 
        ? Math.round((wrongAnswers.count / totalAnswers.count) * 100) 
        : 0,
      topParticipants: topParticipants.results,
      activeToday: activeToday.count || 0,
      avgPoints: Math.round(avgPoints.avg || 0),
      participationRate,
      newUsers: newUsers.count || 0
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    return c.json({ error: 'حدث خطأ' }, 500);
  }
});

// ===== FOOTBALL APIs =====

// Get competitions
app.get('/api/competitions', async (c) => {
  try {
    const data = await getCompetitions(c.env);
    return c.json(data);
  } catch (error) {
    console.error('API /api/competitions error:', error);
    return c.json({ error: 'Failed to fetch competitions', competitions: [] }, 500);
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

// Get player details
app.get('/api/players/:id', async (c) => {
  try {
    const playerId = parseInt(c.req.param('id'));
    const data = await getPlayerById({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, playerId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch player details' }, 500);
  }
});

// Get current matchday matches for a competition
app.get('/api/competitions/:id/current-matches', async (c) => {
  try {
    const competitionId = parseInt(c.req.param('id'));
    const data = await getCurrentMatchdayMatches({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, competitionId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch current matchday matches' }, 500);
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
        <a href="/profile" id="profile-link-desktop" class="nav-link ${currentPage === 'profile' ? 'active' : ''}" style="display: none;">
          <i class="fas fa-user"></i>
          <span class="hidden md:inline">الملف الشخصي</span>
        </a>
      </div>

      <!-- Right Side Controls -->
      <div class="flex items-center gap-2">
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
    <a href="/profile" id="profile-link-mobile" class="mobile-nav-link ${currentPage === 'profile' ? 'active' : ''}" style="display: none;">
      <i class="fas fa-user"></i>
      <span>الملف الشخصي</span>
    </a>
  </div>
  
  <div class="mobile-menu-footer">
    <!-- Mobile user section removed - users access quiz directly -->
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
// Check if user is logged in and show profile link
(function() {
  const token = localStorage.getItem('koorax_token');
  if (token) {
    const desktopLink = document.getElementById('profile-link-desktop');
    const mobileLink = document.getElementById('profile-link-mobile');
    if (desktopLink) desktopLink.style.display = 'flex';
    if (mobileLink) mobileLink.style.display = 'flex';
  }
})();

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
    <title>⚽ Koorax - مباريات كرة القدم | أخبار ونتائج كرة القدم العالمية</title>
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
    
    ${getSEOTags({
      title: 'Koorax - مباريات كرة القدم | أخبار ونتائج كرة القدم العالمية',
      description: 'تابع أحدث مباريات كرة القدم، النتائج المباشرة، والأخبار الرياضية. منصة كوراكس توفر لك كل ما تحتاجه لمتابعة عالم كرة القدم',
      keywords: 'كرة القدم, مباريات كرة القدم, نتائج المباريات, أخبار كرة القدم, كوراكس, Koorax, football, soccer, live scores',
      url: 'https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai/',
      type: 'website'
    })}
    
    <script type="application/ld+json">
    ${getSchemaOrg('WebSite')}
    </script>
    
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
        
        <!-- Top Competitions Section -->
        <div class="glass-card p-6 rounded-2xl mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-black gradient-text">
              <i class="fas fa-trophy mr-3"></i>
              <span>أهم البطولات</span>
            </h2>
            <a href="/competitions" class="text-primary hover:underline">
              <span data-translate="viewAll">عرض الكل</span>
              <i class="fas fa-arrow-left mr-2"></i>
            </a>
          </div>
          <div id="top-competitions" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="skeleton h-24"></div>
            <div class="skeleton h-24"></div>
            <div class="skeleton h-24"></div>
            <div class="skeleton h-24"></div>
            <div class="skeleton h-24"></div>
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
      // ===== User's Local Timezone Helpers =====
      // These functions use the browser's local timezone automatically
      
      function getLocalTime() {
        return new Date(); // Browser automatically uses user's timezone
      }
      
      function convertUTCToLocal(utcDateString) {
        // new Date() automatically converts UTC to local timezone
        return new Date(utcDateString);
      }
      
      function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
      }
      
      function getStatusText(status) {
        const t = window.kooraxT;
        if (status === 'IN_PLAY' || status === 'PAUSED') return t('live');
        if (status === 'FINISHED') return t('finished');
        return t('scheduled');
      }

      async function loadHomeMatches() {
        try {
          console.log('🔄 Loading matches...');
          const response = await axios.get('/api/matches');
          const matches = response.data.matches;
          console.log('✅ Loaded', matches.length, 'matches');
          
          const localNow = getLocalTime();
          console.log('🕒 Local time:', localNow.toLocaleString());
          
          // Filter live matches
          const liveMatches = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
          const upcomingToday = matches.filter(m => {
            const matchLocalDate = convertUTCToLocal(m.utcDate);
            return isSameDay(matchLocalDate, localNow) && m.status === 'SCHEDULED';
          }).slice(0, 6);
          
          console.log('📊 Live:', liveMatches.length, 'Upcoming today:', upcomingToday.length);
          
          // Show live matches
          if (liveMatches.length > 0) {
            document.getElementById('live-section').style.display = 'block';
            document.getElementById('live-matches').innerHTML = liveMatches.map(createMatchCard).join('');
          }
          
          // Show important matches (live + upcoming today)
          const importantMatches = [...liveMatches, ...upcomingToday].slice(0, 6);
          console.log('⭐ Important matches:', importantMatches.length);
          const t = window.kooraxT;
          document.getElementById('important-matches').innerHTML = 
            importantMatches.length > 0 
              ? importantMatches.map(createMatchCard).join('') 
              : '<p class="text-center text-secondary col-span-2 py-12" data-translate="noMatches">لا توجد مباريات مهمة اليوم</p>';
          
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('❌ Error loading matches:', error);
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
        
        // Convert UTC time to local timezone for display
        const matchLocalTime = convertUTCToLocal(match.utcDate);
        
        const score = (match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED')
          ? \`<div class="score-display">\${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}</div>\`
          : \`<div class="text-lg text-secondary">\${matchLocalTime.toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</div>\`;
        
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
      
      // Load top competitions
      async function loadTopCompetitions() {
        try {
          const response = await axios.get('/api/competitions');
          const competitions = response.data.competitions;
          
          // Top competitions: Champions League, Premier League, La Liga, Bundesliga, Serie A, Egyptian League
          const topCompIds = [2001, 2021, 2014, 2002, 2019, 2357];
          const topComps = competitions.filter(c => topCompIds.includes(c.id));
          
          const compInfo = ${JSON.stringify(COMPETITIONS_INFO)};
          const lang = window.kooraxGetLang();
          
          document.getElementById('top-competitions').innerHTML = topComps.map(comp => {
            const info = compInfo[comp.id] || {};
            const compName = lang === 'ar' ? (info.name || comp.name) : (info.nameEn || comp.name);
            const icon = info.icon || '🏆';
            
            return \`
              <a href="/competitions/\${comp.id}" class="glass-card p-4 rounded-xl hover:scale-105 transition-transform text-center">
                <div class="text-4xl mb-2">\${icon}</div>
                <h3 class="text-sm font-bold line-clamp-2">\${compName}</h3>
              </a>
            \`;
          }).join('');
        } catch (error) {
          console.error('Error loading top competitions:', error);
          document.getElementById('top-competitions').innerHTML = '<p class="text-center text-secondary col-span-5">حدث خطأ في تحميل البطولات</p>';
        }
      }
      
      // Load matches when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          loadHomeMatches();
          loadTopCompetitions();
          setInterval(loadHomeMatches, 60000);
        });
      } else {
        loadHomeMatches();
        loadTopCompetitions();
        setInterval(loadHomeMatches, 60000);
      }
      
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
    <title>⚽ Koorax - المباريات | نتائج ومواعيد مباريات كرة القدم</title>
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
    
    ${getSEOTags({
      title: 'Koorax - المباريات | نتائج ومواعيد مباريات كرة القدم',
      description: 'تابع جميع مباريات كرة القدم الهامة، النتائج المباشرة، المواعيد، والبطولات الرئيسية. دوري أبطال أوروبا، الدوريات الأوروبية الخمس الكبرى وأكثر',
      keywords: 'مباريات كرة القدم, نتائج المباريات, مواعيد المباريات, دوري أبطال أوروبا, الدوري الإنجليزي, الدوري الإسباني, matches, fixtures, live scores',
      url: 'https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai/matches',
      type: 'website'
    })}
    
    <script type="application/ld+json">
    ${getSchemaOrg('SportsEvent')}
    </script>
    
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
      // ===== User's Local Timezone Helpers =====
      function getLocalTime() {
        return new Date();
      }
      
      function convertUTCToLocal(utcDateString) {
        return new Date(utcDateString);
      }
      
      function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
      }
      
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
        const localToday = getLocalTime();
        const dates = [];
        
        // Generate 5 days (2 past + today + 2 future) using local timezone
        for (let i = -2; i <= 2; i++) {
          const date = new Date(localToday);
          date.setDate(localToday.getDate() + i);
          dates.push(date);
        }
        
        const t = window.kooraxT || (key => key);
        const lang = document.documentElement.lang;
        
        container.innerHTML = dates.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const dayName = date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
          const dayNumber = date.getDate();
          const isToday = isSameDay(date, localToday);
          
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
        
        // Set today as default (local timezone)
        currentDate = localToday.toISOString().split('T')[0];
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
            const matchLocalDate = convertUTCToLocal(m.utcDate);
            const matchDateStr = matchLocalDate.toISOString().split('T')[0];
            return matchDateStr === currentDate;
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
        
        // Convert UTC time to local timezone for display
        const matchLocalTime = convertUTCToLocal(match.utcDate);
        
        const score = (match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED')
          ? \`<div class="score-display">\${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}</div>\`
          : \`<div class="text-lg text-secondary">\${matchLocalTime.toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</div>\`;
        
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
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
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
        
        // Check if we have detailed event data
        const hasGoals = match.goals && match.goals.length > 0;
        const hasBookings = match.bookings && match.bookings.length > 0;
        const hasSubstitutions = match.substitutions && match.substitutions.length > 0;
        
        if (hasGoals || hasBookings || hasSubstitutions) {
          const allEvents = [];
          
          // Add goals with minutes
          if (hasGoals) {
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
          }
          
          // Add bookings (cards) with minutes
          if (hasBookings) {
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
          
          // Add substitutions with minutes
          if (hasSubstitutions) {
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
        } else if (isFinished || isLive) {
          // Show message when detailed data is not available
          eventsHtml = \`
            <div class="glass-card p-6 rounded-2xl mb-6">
              <h3 class="text-xl font-bold mb-4">
                <i class="fas fa-list-ul mr-2"></i>
                \${t('events') || 'أحداث المباراة'}
              </h3>
              <div class="text-center py-8 text-secondary">
                <i class="fas fa-info-circle text-4xl mb-3"></i>
                <p>تفاصيل الأحداث (الأهداف بالدقائق، التشكيلة، الإحصاءات التفصيلية) تتطلب اشتراك Premium في API</p>
                <p class="text-sm mt-2">النتيجة النهائية: \${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}</p>
              </div>
            </div>
          \`;
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
        } else {
          // Show info message when lineups are not available
          lineupsHtml = \`
            <div class="glass-card p-6 rounded-2xl mb-6 bg-blue-500/10 border border-blue-500/30">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                  <i class="fas fa-info-circle text-blue-400 text-3xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold mb-2 text-blue-400">
                    <i class="fas fa-users mr-2"></i>
                    \${t('lineup') || 'التشكيل'}
                  </h3>
                  <p class="text-secondary leading-relaxed mb-3">
                    📢 <strong>التشكيلة والأحداث التفصيلية</strong> (أهداف بالدقائق، بطاقات، تبديلات، الدقيقة الحالية للمباريات المباشرة) غير متوفرة في النسخة المجانية من API.
                    <br><br>
                    للحصول على هذه البيانات المتقدمة، يتطلب الأمر اشتراكاً <strong>Premium (Tier Plan)</strong> في Football-Data.org API.
                  </p>
                  <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-2">
                    <div class="flex items-center gap-2 text-green-400 font-bold mb-2">
                      <i class="fas fa-check-circle"></i>
                      <span>البيانات المتوفرة حالياً:</span>
                    </div>
                    <ul class="text-sm text-secondary space-y-1 pr-6">
                      <li>✅ النتيجة النهائية</li>
                      <li>✅ نتيجة الشوط الأول</li>
                      <li>✅ معلومات الفريقين والشعارات</li>
                      <li>✅ معلومات البطولة</li>
                      <li>✅ اسم الحكم وجنسيته</li>
                      <li>✅ توقيت المباراة</li>
                      <li>✅ حالة المباراة (مباشر/منتهية/لم تبدأ)</li>
                    </ul>
                  </div>
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
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
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
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
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
          <div class="grid grid-cols-3 gap-2">
            <button onclick="showTab('standings')" class="tab-btn active" data-tab="standings">
              <i class="fas fa-list-ol mr-2"></i>
              <span data-translate="standings">الترتيب</span>
            </button>
            <button onclick="showTab('scorers')" class="tab-btn" data-tab="scorers">
              <i class="fas fa-futbol mr-2"></i>
              <span data-translate="topScorers">الهدافون</span>
            </button>
            <button onclick="showTab('matchday')" class="tab-btn" data-tab="matchday">
              <i class="fas fa-calendar-week mr-2"></i>
              <span>مباريات الجولة</span>
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
        
        <div id="matchday-tab" class="tab-content">
          <div class="skeleton h-96"></div>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      const compId = ${compId};
      let currentTab = 'standings';
      
      // Competitions info
      window.COMPETITIONS_INFO = ${JSON.stringify(COMPETITIONS_INFO)};
      
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
        } else if (tab === 'scorers') {
          loadScorers();
        } else if (tab === 'matchday') {
          loadMatchday();
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
          const compInfo = window.COMPETITIONS_INFO[comp.id] || {};
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
                          <tr class="border-b border-white/5 hover:bg-white/5 transition cursor-pointer" onclick="window.location.href='/teams/\${team.team.id}'">
                            <td class="p-3">
                              <div class="w-8 h-8 rounded-full \${idx < 4 ? 'bg-green-500/20 text-green-500' : idx >= standing.table.length - 3 ? 'bg-red-500/20 text-red-500' : 'bg-white/10'} flex items-center justify-center font-bold text-sm">
                                \${team.position}
                              </div>
                            </td>
                            <td class="p-3">
                              <div class="flex items-center gap-3">
                                <img src="\${team.team.crest}" class="w-8 h-8" onerror="this.style.display='none'">
                                <span class="font-medium hover:text-primary transition">\${team.team.name}</span>
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
                      <tr class="border-b border-white/5 hover:bg-white/5 transition cursor-pointer" onclick="window.location.href='/players/\${scorer.player.id}'">
                        <td class="p-3">
                          <div class="w-8 h-8 rounded-full \${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-gray-400/20 text-gray-400' : idx === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/10'} flex items-center justify-center font-bold text-sm">
                            \${idx + 1}
                          </div>
                        </td>
                        <td class="p-3">
                          <p class="font-bold hover:text-primary transition">\${scorer.player.name}</p>
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
      
      async function loadMatchday() {
        try {
          const response = await axios.get(\`/api/competitions/\${compId}/current-matches\`);
          const matches = response.data.matches;
          const t = window.kooraxT;
          
          const container = document.getElementById('matchday-tab');
          
          if (!matches || matches.length === 0) {
            container.innerHTML = \`
              <div class="glass-card p-12 text-center rounded-2xl">
                <i class="fas fa-calendar-times text-6xl text-secondary mb-4"></i>
                <p class="text-xl text-secondary">لا توجد مباريات في الجولة الحالية</p>
              </div>
            \`;
            return;
          }
          
          // Group matches by matchday
          const matchesByMatchday = {};
          matches.forEach(match => {
            const matchday = match.matchday || match.stage || 'غير محدد';
            if (!matchesByMatchday[matchday]) {
              matchesByMatchday[matchday] = [];
            }
            matchesByMatchday[matchday].push(match);
          });
          
          let html = '';
          Object.entries(matchesByMatchday).forEach(([matchday, dayMatches]) => {
            html += \`
              <div class="glass-card p-6 rounded-2xl mb-6">
                <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                  <i class="fas fa-calendar-week text-primary"></i>
                  الجولة \${matchday}
                </h3>
                <div class="space-y-3">
                  \${dayMatches.map(match => {
                    const statusBadge = match.status === 'IN_PLAY' 
                      ? '<span class="badge badge-live"><i class="fas fa-circle text-red-500 animate-pulse mr-1"></i>مباشر</span>'
                      : match.status === 'FINISHED'
                      ? '<span class="badge badge-finished">انتهت</span>'
                      : '<span class="badge badge-scheduled">لم تبدأ</span>';
                    
                    const date = new Date(match.utcDate);
                    const time = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
                    
                    return \`
                      <a href="/matches/\${match.id}" class="block">
                        <div class="match-card hover:scale-[1.02] transition-transform">
                          <div class="flex items-center justify-between">
                            <div class="flex-1 text-right">
                              <div class="flex items-center justify-end gap-2">
                                <span class="font-bold">\${match.homeTeam.name}</span>
                                \${match.homeTeam.crest ? \`<img src="\${match.homeTeam.crest}" class="w-8 h-8">\` : ''}
                              </div>
                            </div>
                            <div class="px-6 text-center min-w-[100px]">
                              \${match.status === 'FINISHED' || match.status === 'IN_PLAY' 
                                ? \`<div class="text-2xl font-black">\${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}</div>\`
                                : \`<div class="text-sm text-secondary">\${time}<br>\${dateStr}</div>\`
                              }
                              \${statusBadge}
                            </div>
                            <div class="flex-1 text-left">
                              <div class="flex items-center gap-2">
                                \${match.awayTeam.crest ? \`<img src="\${match.awayTeam.crest}" class="w-8 h-8">\` : ''}
                                <span class="font-bold">\${match.awayTeam.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </a>
                    \`;
                  }).join('')}
                </div>
              </div>
            \`;
          });
          
          container.innerHTML = html;
        } catch (error) {
          console.error('Error loading matchday:', error);
          document.getElementById('matchday-tab').innerHTML = 
            \`<p class="text-center text-red-500 py-12">حدث خطأ أثناء تحميل مباريات الجولة</p>\`;
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
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
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
                  const matchLocalTime = convertUTCToLocal(match.utcDate);
                  const score = match.score.fullTime.home !== null 
                    ? \`\${match.score.fullTime.home} - \${match.score.fullTime.away}\`
                    : matchLocalTime.toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'});
                  
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

// Player Details Page
app.get('/players/:id', (c) => {
  const playerId = c.req.param('id');
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - معلومات اللاعب</title>
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader('competitions')}
    
    <div class="container mx-auto px-4 py-6">
        <!-- Back Button -->
        <button onclick="history.back()" class="glass-card px-4 py-2 rounded-lg mb-6 hover:bg-white/10 transition">
          <i class="fas fa-arrow-right mr-2"></i>
          رجوع
        </button>

        <!-- Player Header -->
        <div id="player-header" class="glass-card p-6 rounded-2xl mb-6">
          <div class="skeleton h-32"></div>
        </div>

        <!-- Player Stats -->
        <div id="player-stats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="skeleton h-24"></div>
          <div class="skeleton h-24"></div>
          <div class="skeleton h-24"></div>
        </div>

        <!-- Player Details -->
        <div id="player-details" class="glass-card p-6 rounded-2xl">
          <div class="skeleton h-64"></div>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      const playerId = ${playerId};
      
      async function loadPlayerInfo() {
        try {
          const response = await axios.get(\`/api/players/\${playerId}\`);
          const player = response.data;
          
          // Player Header
          const nationality = player.nationality ? \`<img src="https://flagcdn.com/w40/\${getNationalityCode(player.nationality)}.png" class="w-8 h-5 inline-block mr-2" onerror="this.style.display='none'">\` : '';
          
          document.getElementById('player-header').innerHTML = \`
            <div class="flex flex-col md:flex-row items-center gap-6">
              <div class="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <i class="fas fa-user text-6xl text-primary"></i>
              </div>
              <div class="flex-1 text-center md:text-right">
                <h1 class="text-4xl font-black gradient-text mb-2">\${player.name}</h1>
                <p class="text-xl text-secondary mb-2">
                  \${nationality}
                  \${player.nationality || 'غير محدد'}
                </p>
                <div class="flex flex-wrap gap-3 justify-center md:justify-start">
                  <span class="badge badge-primary">
                    <i class="fas fa-running mr-1"></i>
                    \${player.position || 'غير محدد'}
                  </span>
                  \${player.dateOfBirth ? \`<span class="badge badge-secondary">
                    <i class="fas fa-birthday-cake mr-1"></i>
                    \${calculateAge(player.dateOfBirth)} سنة
                  </span>\` : ''}
                  \${player.currentTeam ? \`<span class="badge badge-team">
                    <i class="fas fa-shield-alt mr-1"></i>
                    \${player.currentTeam.name}
                  </span>\` : ''}
                </div>
              </div>
            </div>
          \`;

          // Player Stats
          document.getElementById('player-stats').innerHTML = \`
            <div class="glass-card p-4 rounded-xl text-center">
              <i class="fas fa-calendar text-3xl text-primary mb-2"></i>
              <p class="text-sm text-secondary">تاريخ الميلاد</p>
              <p class="text-xl font-bold">\${player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
            </div>
            <div class="glass-card p-4 rounded-xl text-center">
              <i class="fas fa-flag text-3xl text-green-500 mb-2"></i>
              <p class="text-sm text-secondary">الجنسية</p>
              <p class="text-xl font-bold">\${player.nationality || 'غير محدد'}</p>
            </div>
            <div class="glass-card p-4 rounded-xl text-center">
              <i class="fas fa-map-marker-alt text-3xl text-red-500 mb-2"></i>
              <p class="text-sm text-secondary">الفريق الحالي</p>
              <p class="text-xl font-bold">\${player.currentTeam?.name || 'غير محدد'}</p>
            </div>
          \`;

          // Player Details
          document.getElementById('player-details').innerHTML = \`
            <h2 class="text-2xl font-bold mb-4">
              <i class="fas fa-info-circle text-primary mr-2"></i>
              التفاصيل الكاملة
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 rounded-lg bg-white/5">
                <p class="text-secondary mb-1">الاسم الكامل</p>
                <p class="font-bold">\${player.name}</p>
              </div>
              <div class="p-4 rounded-lg bg-white/5">
                <p class="text-secondary mb-1">المركز</p>
                <p class="font-bold">\${player.position || 'غير محدد'}</p>
              </div>
              <div class="p-4 rounded-lg bg-white/5">
                <p class="text-secondary mb-1">الجنسية</p>
                <p class="font-bold">\${player.nationality || 'غير محدد'}</p>
              </div>
              <div class="p-4 rounded-lg bg-white/5">
                <p class="text-secondary mb-1">تاريخ الميلاد</p>
                <p class="font-bold">\${player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
              </div>
              \${player.currentTeam ? \`
              <div class="p-4 rounded-lg bg-white/5 md:col-span-2">
                <p class="text-secondary mb-2">الفريق الحالي</p>
                <div class="flex items-center gap-3">
                  \${player.currentTeam.crest ? \`<img src="\${player.currentTeam.crest}" class="w-12 h-12">\` : ''}
                  <div>
                    <p class="font-bold text-lg">\${player.currentTeam.name}</p>
                    <p class="text-sm text-secondary">\${player.currentTeam.area?.name || ''}</p>
                  </div>
                </div>
              </div>
              \` : ''}
              \${player.section ? \`
              <div class="p-4 rounded-lg bg-white/5">
                <p class="text-secondary mb-1">القسم</p>
                <p class="font-bold">\${player.section}</p>
              </div>
              \` : ''}
            </div>
          \`;
        } catch (error) {
          console.error('Error loading player info:', error);
          document.getElementById('player-header').innerHTML = 
            \`<p class="text-center text-red-500 py-12">حدث خطأ أثناء تحميل معلومات اللاعب</p>\`;
        }
      }
      
      function getNationalityCode(nationality) {
        const codes = {
          'Argentina': 'ar', 'Brazil': 'br', 'England': 'gb-eng', 'Spain': 'es',
          'France': 'fr', 'Germany': 'de', 'Italy': 'it', 'Portugal': 'pt',
          'Netherlands': 'nl', 'Belgium': 'be', 'Egypt': 'eg', 'Morocco': 'ma',
          'Saudi Arabia': 'sa', 'UAE': 'ae', 'Tunisia': 'tn', 'Algeria': 'dz',
          'Uruguay': 'uy', 'Colombia': 'co', 'Mexico': 'mx', 'Croatia': 'hr',
          'Poland': 'pl', 'Senegal': 'sn', 'Ghana': 'gh', 'Cameroon': 'cm',
          'Nigeria': 'ng', 'South Korea': 'kr', 'Japan': 'jp', 'Australia': 'au',
          'Serbia': 'rs', 'Switzerland': 'ch', 'Denmark': 'dk', 'Sweden': 'se',
          'Norway': 'no', 'Austria': 'at', 'Czech Republic': 'cz', 'Turkey': 'tr',
          'Ukraine': 'ua', 'Wales': 'gb-wls', 'Scotland': 'gb-sct', 'Ireland': 'ie',
          'Chile': 'cl', 'Peru': 'pe', 'Ecuador': 'ec', 'Venezuela': 've',
          'Paraguay': 'py', 'Bolivia': 'bo', 'Costa Rica': 'cr', 'Honduras': 'hn',
          'Panama': 'pa', 'Jamaica': 'jm', 'Canada': 'ca', 'USA': 'us',
          'South Africa': 'za', 'Ivory Coast': 'ci', 'Mali': 'ml', 'Burkina Faso': 'bf'
        };
        return codes[nationality] || nationality.toLowerCase().substring(0, 2);
      }
      
      function calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      }
      
      loadPlayerInfo();
    </script>
</body>
</html>
  `);
});



// Standalone Quiz Page - فزورة كوراكس (Complete with Header, Login, etc.)
// ===== QUIZ PAGE =====
app.get('/quiz', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - فزورة كوراكس | اختبر معلوماتك في كرة القدم واربح النقاط</title>
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
    
    ${getSEOTags({
      title: 'Koorax - فزورة كوراكس | اختبر معلوماتك في كرة القدم',
      description: 'شارك في فزورة كرة القدم اليومية! اختبر معلوماتك، اربح النقاط، وتصدّر لوحة المتصدرين. سؤال جديد كل يوم مع مؤقت 60 ثانية',
      keywords: 'فزورة كرة القدم, اختبار كرة القدم, مسابقة كرة القدم, أسئلة كرة القدم, كوراكس كويز, football quiz, soccer trivia',
      url: 'https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai/quiz',
      type: 'quiz'
    })}
    
    <script type="application/ld+json">
    ${getSchemaOrg('Quiz')}
    </script>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
    <style>
    .btn-primary {
      padding: 14px 24px;
      border-radius: 12px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
    }
    .btn-secondary {
      padding: 14px 24px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-weight: 700;
      border: 2px solid rgba(34, 197, 94, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-secondary:hover {
      background: rgba(34, 197, 94, 0.2);
      border-color: #22c55e;
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
      border: 2px solid rgba(34, 197, 94, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    .form-input:focus {
      outline: none;
      border-color: #22c55e;
      background: rgba(255, 255, 255, 0.08);
    }
    
    /* Toast Notifications */
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }
    .toast {
      padding: 16px 20px;
      border-radius: 16px;
      backdrop-filter: blur(10px);
      border: 2px solid;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .toast.success {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.3));
      border-color: #22c55e;
      color: #22c55e;
    }
    .toast.error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3));
      border-color: #ef4444;
      color: #ef4444;
    }
    .toast.info {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3));
      border-color: #3b82f6;
      color: #3b82f6;
    }
    .toast-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    .toast-message {
      flex: 1;
      font-weight: 600;
      font-size: 15px;
      color: #fff;
    }
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes fadeOut {
      to {
        opacity: 0;
        transform: translateX(400px);
      }
    }
    </style>
</head>
<body>
    <!-- Toast Container -->
    <div id="toast-container" class="toast-container"></div>
    
    ${getEnhancedHeader('quiz')}
    
    <div class="container mx-auto px-4 py-6">
        <!-- Auth Section -->
        <div id="auth-section" class="max-w-md mx-auto">
          <div class="glass-card p-8 rounded-2xl text-center">
            <i class="fas fa-lock text-6xl gradient-text mb-6"></i>
            <h2 class="text-3xl font-black gradient-text mb-4">تسجيل الدخول مطلوب</h2>
            <p class="text-gray-400 mb-6">يجب عليك تسجيل الدخول أو إنشاء حساب للمشاركة في الفزورة اليومية</p>
            <div class="flex gap-4 justify-center">
              <button onclick="showTab('register')" class="btn-primary">
                <i class="fas fa-user-plus"></i>
                إنشاء حساب
              </button>
              <button onclick="showTab('login')" class="btn-secondary">
                <i class="fas fa-sign-in-alt"></i>
                تسجيل دخول
              </button>
            </div>
          </div>
          
          <!-- Register Form -->
          <div id="register-form" class="glass-card p-8 rounded-2xl mt-6" style="display: none;">
            <h3 class="text-2xl font-bold mb-6 text-center gradient-text">إنشاء حساب جديد</h3>
            <form onsubmit="handleRegister(event)">
              <div class="form-group mb-4">
                <label class="form-label">الاسم</label>
                <input type="text" id="reg-name" class="form-input" required minlength="3">
              </div>
              <div class="form-group mb-4">
                <label class="form-label">البريد الإلكتروني</label>
                <input type="email" id="reg-email" class="form-input" required>
              </div>
              <div class="form-group mb-4">
                <label class="form-label">كلمة السر</label>
                <input type="password" id="reg-password" class="form-input" required minlength="6">
              </div>
              <div class="form-group mb-4">
                <label class="form-label">تأكيد كلمة السر</label>
                <input type="password" id="reg-confirm" class="form-input" required>
              </div>
              <div id="reg-message" class="text-center mb-4"></div>
              <button type="submit" class="btn-primary w-full">
                <i class="fas fa-user-plus"></i>
                إنشاء الحساب
              </button>
              <p class="text-center mt-4 text-sm">
                لديك حساب؟ 
                <button type="button" onclick="showTab('login')" class="text-primary hover:underline">تسجيل الدخول</button>
              </p>
            </form>
          </div>
          
          <!-- Login Form -->
          <div id="login-form" class="glass-card p-8 rounded-2xl mt-6" style="display: none;">
            <h3 class="text-2xl font-bold mb-6 text-center gradient-text">تسجيل الدخول</h3>
            <form onsubmit="handleLogin(event)">
              <div class="form-group mb-4">
                <label class="form-label">البريد الإلكتروني</label>
                <input type="email" id="login-email" class="form-input" required>
              </div>
              <div class="form-group mb-4">
                <label class="form-label">كلمة السر</label>
                <input type="password" id="login-password" class="form-input" required>
              </div>
              <div id="login-message" class="text-center mb-4"></div>
              <button type="submit" class="btn-primary w-full">
                <i class="fas fa-sign-in-alt"></i>
                دخول
              </button>
              <p class="text-center mt-4 text-sm">
                ليس لديك حساب؟ 
                <button type="button" onclick="showTab('register')" class="text-primary hover:underline">إنشاء حساب</button>
              </p>
            </form>
          </div>
          

        </div>

        <!-- Quiz Section -->
        <div id="quiz-section" style="display: none;">
          <div class="glass-card p-6 rounded-2xl mb-6">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <i class="fas fa-calendar-day text-3xl gradient-text"></i>
                <h2 class="text-3xl font-black gradient-text">فزورة اليوم</h2>
              </div>
            </div>
            
            <div id="quiz-content">
              <div id="question-card">
                <!-- Timer -->
                <div class="mb-6 text-center">
                  <div class="inline-flex items-center gap-3 px-6 py-3 rounded-xl glass-card">
                    <i class="fas fa-clock text-2xl text-primary"></i>
                    <span class="text-3xl font-black text-primary" id="quiz-timer">60</span>
                    <span class="text-lg text-gray-400">ثانية</span>
                  </div>
                </div>
                
                <h3 class="text-xl font-bold mb-4" id="question-text">جاري تحميل السؤال...</h3>
                <div id="options-container" class="grid gap-4"></div>
                <div id="result-message" class="mt-6"></div>
              </div>
              
              <div id="answered-card" style="display: none;">
                <div class="text-center p-8">
                  <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                  <h3 class="text-2xl font-bold mb-2">لقد أجبت على هذا السؤال!</h3>
                  <p class="text-gray-400">عد غداً للإجابة على سؤال جديد</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="glass-card p-6 rounded-2xl">
            <div class="flex items-center gap-3 mb-6">
              <i class="fas fa-trophy text-3xl gradient-text"></i>
              <h2 class="text-2xl font-black gradient-text">لوحة المتصدرين</h2>
            </div>
            <div id="leaderboard-container" class="space-y-3"></div>
          </div>
        </div>

        <!-- Admin Section -->
        <div id="admin-section" style="display: none;">
          <div class="glass-card p-6 rounded-2xl mb-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold gradient-text">لوحة التحكم</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="glass-card p-4 rounded-xl">
                <i class="fas fa-users text-3xl text-primary mb-2"></i>
                <h3 class="text-lg font-bold">إجمالي المتسابقين</h3>
                <p class="text-3xl font-black text-primary" id="total-users">0</p>
              </div>
              <div class="glass-card p-4 rounded-xl">
                <i class="fas fa-question-circle text-3xl text-green-500 mb-2"></i>
                <h3 class="text-lg font-bold">إجمالي الأسئلة</h3>
                <p class="text-3xl font-black text-green-500" id="total-questions">0</p>
              </div>
              <div class="glass-card p-4 rounded-xl">
                <i class="fas fa-chart-line text-3xl text-blue-500 mb-2"></i>
                <h3 class="text-lg font-bold">إجابات اليوم</h3>
                <p class="text-3xl font-black text-blue-500" id="today-answers">0</p>
              </div>
            </div>
            
            <!-- Analytics Section -->
            <div class="mb-6">
              <h3 class="text-xl font-bold mb-4">
                <i class="fas fa-chart-bar mr-2"></i>
                تحليل المتسابقين
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="glass-card p-4 rounded-xl">
                  <h4 class="text-lg font-semibold mb-3">نسبة النجاح</h4>
                  <div class="mb-2">
                    <div class="flex justify-between text-sm mb-1">
                      <span>إجابات صحيحة</span>
                      <span id="correct-answers-percent">0%</span>
                    </div>
                    <div class="stat-bar">
                      <div class="stat-fill bg-green-500" id="correct-answers-bar" style="width: 0%"></div>
                    </div>
                  </div>
                  <div class="mb-2">
                    <div class="flex justify-between text-sm mb-1">
                      <span>إجابات خاطئة</span>
                      <span id="wrong-answers-percent">0%</span>
                    </div>
                    <div class="stat-bar">
                      <div class="stat-fill bg-red-500" id="wrong-answers-bar" style="width: 0%"></div>
                    </div>
                  </div>
                </div>
                
                <div class="glass-card p-4 rounded-xl">
                  <h4 class="text-lg font-semibold mb-3">أفضل المتسابقين</h4>
                  <div id="top-participants" class="space-y-2"></div>
                </div>
                
                <div class="glass-card p-4 rounded-xl">
                  <h4 class="text-lg font-semibold mb-3">نشاط المتسابقين</h4>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span>نشط اليوم</span>
                      <span class="text-primary font-bold" id="active-today">0</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span>إجمالي الإجابات</span>
                      <span class="text-primary font-bold" id="total-answers">0</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span>متوسط النقاط</span>
                      <span class="text-primary font-bold" id="avg-points">0</span>
                    </div>
                  </div>
                </div>
                
                <div class="glass-card p-4 rounded-xl">
                  <h4 class="text-lg font-semibold mb-3">معدل المشاركة</h4>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span>معدل مشاركة يومي</span>
                      <span class="text-primary font-bold" id="participation-rate">0%</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span>مستخدمون جدد</span>
                      <span class="text-green-500 font-bold" id="new-users">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mb-6">
              <h3 class="text-xl font-bold mb-4">المتسابقون</h3>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-700">
                      <th class="p-3 text-right">الاسم</th>
                      <th class="p-3 text-right">البريد</th>
                      <th class="p-3 text-right">النقاط</th>
                      <th class="p-3 text-right">تاريخ التسجيل</th>
                      <th class="p-3 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody id="participants-table"></tbody>
                </table>
              </div>
            </div>
            
            <!-- Questions Management Section -->
            <div class="mb-6">
              <h3 class="text-xl font-bold mb-4">
                <i class="fas fa-list mr-2"></i>
                إدارة الأسئلة
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-700">
                      <th class="p-3 text-right">ID</th>
                      <th class="p-3 text-right">السؤال</th>
                      <th class="p-3 text-right">الإجابة الصحيحة</th>
                      <th class="p-3 text-right">تاريخ الإضافة</th>
                      <th class="p-3 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody id="questions-table"></tbody>
                </table>
              </div>
            </div>
            
            <!-- Questions Management Table -->
            <div class="mb-8">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold">إدارة الأسئلة</h3>
                <button onclick="loadQuestions()" class="btn-secondary">
                  <i class="fas fa-sync-alt"></i>
                  تحديث
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-700">
                      <th class="text-right p-3">#</th>
                      <th class="text-right p-3">السؤال</th>
                      <th class="text-center p-3">الإجابة الصحيحة</th>
                      <th class="text-center p-3">التاريخ</th>
                      <th class="text-center p-3">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody id="questions-table">
                    <tr>
                      <td colspan="5" class="text-center p-8 text-gray-400">جاري التحميل...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h3 class="text-xl font-bold mb-4">إضافة سؤال جديد</h3>
              <form onsubmit="handleAddQuestion(event)" class="space-y-4">
                <div class="form-group">
                  <label class="form-label">نص السؤال</label>
                  <textarea id="q-text" class="form-input" rows="3" required></textarea>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label class="form-label">الخيار A</label>
                    <input type="text" id="q-a" class="form-input" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">الخيار B</label>
                    <input type="text" id="q-b" class="form-input" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">الخيار C</label>
                    <input type="text" id="q-c" class="form-input" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">الخيار D</label>
                    <input type="text" id="q-d" class="form-input" required>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">الإجابة الصحيحة</label>
                  <select id="q-correct" class="form-input" required>
                    <option value="">اختر الإجابة</option>
                    <option value="a">A</option>
                    <option value="b">B</option>
                    <option value="c">C</option>
                    <option value="d">D</option>
                  </select>
                </div>
                <button type="submit" class="btn-primary">
                  <i class="fas fa-plus"></i>
                  إضافة السؤال
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <!-- Edit Question Modal -->
        <div id="edit-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center;">
          <div class="glass-card p-6 rounded-2xl max-w-2xl mx-4" style="max-height: 90vh; overflow-y: auto;">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-bold gradient-text">تعديل السؤال</h3>
              <button onclick="closeEditModal()" class="text-white text-2xl">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <form onsubmit="handleUpdateQuestion(event)" class="space-y-4">
              <input type="hidden" id="edit-q-id">
              <div class="form-group">
                <label class="form-label">نص السؤال</label>
                <textarea id="edit-q-text" class="form-input" rows="3" required></textarea>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">الخيار A</label>
                  <input type="text" id="edit-q-a" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">الخيار B</label>
                  <input type="text" id="edit-q-b" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">الخيار C</label>
                  <input type="text" id="edit-q-c" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">الخيار D</label>
                  <input type="text" id="edit-q-d" class="form-input" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">الإجابة الصحيحة</label>
                <select id="edit-q-correct" class="form-input" required>
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>
              <div class="flex gap-4">
                <button type="submit" class="btn-primary flex-1">
                  <i class="fas fa-save"></i>
                  حفظ التعديلات
                </button>
                <button type="button" onclick="closeEditModal()" class="btn-secondary flex-1">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
    </div>

    <script>
    let currentUser = null;

    async function init() {
      const token = localStorage.getItem('koorax_token');
      if (token) {
        try {
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: \`Bearer \${token}\` }
          });
          currentUser = response.data.user;
          showQuizSection();
          
          // Add page leave tracking for non-admin users
          if (currentUser.is_admin !== 1) {
            setupLeaveTracking();
          }
        } catch (error) {
          localStorage.removeItem('koorax_token');
          showAuthSection();
        }
      } else {
        showAuthSection();
      }
    }
    
    function setupLeaveTracking() {
      // Track when user leaves the quiz page without answering
      window.addEventListener('beforeunload', async (e) => {
        // Only apply penalty if there's an active question and user hasn't answered
        if (currentQuestionId && !hasAnswered && timeLeft > 0) {
          const token = localStorage.getItem('koorax_token');
          
          // Use sendBeacon for reliable sending during page unload
          const data = JSON.stringify({ 
            questionId: currentQuestionId,
            token: token
          });
          const blob = new Blob([data], { type: 'application/json' });
          
          navigator.sendBeacon('/api/quiz/leave-penalty', blob);
          
          // Note: Can't show toast or alert during beforeunload
        }
      });
    }

    function showAuthSection() {
      document.getElementById('auth-section').style.display = 'block';
      document.getElementById('quiz-section').style.display = 'none';
      document.getElementById('admin-section').style.display = 'none';
    }

    async function showQuizSection() {
      document.getElementById('auth-section').style.display = 'none';
      
      if (currentUser.is_admin === 1) {
        document.getElementById('admin-section').style.display = 'block';
        document.getElementById('quiz-section').style.display = 'none';
        await loadAdminDashboard();
        await loadQuestions();
      } else {
        document.getElementById('admin-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'block';
        await loadQuiz();
        await loadLeaderboard();
      }
    }

    function showTab(tab) {
      document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
      document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    }

    async function handleRegister(e) {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;
      
      if (password !== confirm) {
        showToast('كلمة السر غير متطابقة', 'error');
        return;
      }
      
      try {
        // Register the user
        const registerResponse = await axios.post('/api/auth/register', { name, email, password });
        showToast('🎉 تم إنشاء الحساب بنجاح!', 'success');
        
        // Auto login after successful registration
        setTimeout(async () => {
          try {
            const loginResponse = await axios.post('/api/auth/login', { email, password });
            localStorage.setItem('koorax_token', loginResponse.data.token);
            currentUser = loginResponse.data.user;
            showToast(\`مرحباً \${name}! 🌟\`, 'success');
            showQuizSection();
          } catch (loginError) {
            showToast('تم إنشاء الحساب، يرجى تسجيل الدخول', 'info');
            setTimeout(() => showTab('login'), 2000);
          }
        }, 1000);
      } catch (error) {
        showToast(error.response?.data?.error || 'حدث خطأ', 'error');
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        const response = await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('koorax_token', response.data.token);
        currentUser = response.data.user;
        showToast(\`مرحباً \${response.data.user.name}! 🎯\`, 'success');
        showQuizSection();
      } catch (error) {
        showToast(error.response?.data?.error || 'بيانات غير صحيحة', 'error');
      }
    }

    let currentQuestionId = null;
    let quizTimer = null;
    let timeLeft = 60; // 60 seconds
    let hasAnswered = false;
    
    function startTimer() {
      clearInterval(quizTimer);
      timeLeft = 60;
      hasAnswered = false;
      updateTimerDisplay();
      
      quizTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
          clearInterval(quizTimer);
          handleTimeOut();
        }
      }, 1000);
    }
    
    function updateTimerDisplay() {
      const timerEl = document.getElementById('quiz-timer');
      if (timerEl) {
        timerEl.textContent = timeLeft;
        
        // Change color based on time left
        if (timeLeft <= 10) {
          timerEl.className = 'text-3xl font-black text-red-500';
        } else if (timeLeft <= 30) {
          timerEl.className = 'text-3xl font-black text-yellow-500';
        } else {
          timerEl.className = 'text-3xl font-black text-primary';
        }
      }
    }
    
    async function handleTimeOut() {
      if (hasAnswered) return;
      
      hasAnswered = true;
      const token = localStorage.getItem('koorax_token');
      
      // Auto-submit wrong answer when time is up
      try {
        const response = await axios.post('/api/quiz/answer', 
          { questionId: currentQuestionId, answer: 'timeout' }, 
          { headers: { Authorization: \`Bearer \${token}\` }}
        );
        
        // Hide the question card and show "time up" message
        document.getElementById('question-card').style.display = 'none';
        document.getElementById('answered-card').style.display = 'block';
        document.getElementById('answered-card').innerHTML = \`
          <div class="text-center p-8">
            <i class="fas fa-hourglass-end text-6xl text-red-500 mb-4 animate-bounce"></i>
            <h3 class="text-3xl font-bold mb-4 text-red-500">⏰ انتهى الوقت!</h3>
            <p class="text-xl text-gray-300 mb-4">للأسف، لم تتمكن من الإجابة في الوقت المحدد</p>
            <div class="p-4 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded-xl mt-4">
              <p class="text-lg font-bold text-green-500 mb-2">الإجابة الصحيحة:</p>
              <p class="text-2xl font-black text-white">\${response.data.correctAnswer}</p>
            </div>
            <p class="text-gray-400 mt-6">عد غداً لسؤال جديد 🌟</p>
          </div>
        \`;
        
        setTimeout(() => loadLeaderboard(), 3000);
      } catch (error) {
        console.error('Error handling timeout:', error);
      }
    }
    
    async function loadQuiz() {
      try {
        const token = localStorage.getItem('koorax_token');
        const response = await axios.get('/api/quiz/today', {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        
        if (response.data.alreadyAnswered) {
          clearInterval(quizTimer);
          document.getElementById('question-card').style.display = 'none';
          document.getElementById('answered-card').style.display = 'block';
        } else {
          // Save question ID for submission
          currentQuestionId = response.data.id;
          
          // Start timer
          startTimer();
          
          // Get question text and options directly from response
          document.getElementById('question-text').textContent = response.data.question;
          
          const options = response.data.options;
          const container = document.getElementById('options-container');
          container.innerHTML = Object.entries(options).map(([key, value]) => \`
            <button onclick="submitAnswer('\${key}')" class="quiz-option p-4 rounded-xl bg-gray-800 hover:bg-green-600 transition-all text-right border-2 border-gray-700 hover:border-green-500">
              <span class="font-bold">\${key.toUpperCase()})</span> \${value}
            </button>
          \`).join('');
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
      }
    }

    async function submitAnswer(answer) {
      if (hasAnswered) return;
      
      hasAnswered = true;
      clearInterval(quizTimer);
      
      try {
        const token = localStorage.getItem('koorax_token');
        const response = await axios.post('/api/quiz/answer', 
          { questionId: currentQuestionId, answer }, 
          { headers: { Authorization: \`Bearer \${token}\` }}
        );
        
        // Hide question card and show result in answered-card
        document.getElementById('question-card').style.display = 'none';
        document.getElementById('answered-card').style.display = 'block';
        
        if (response.data.correct) {
          document.getElementById('answered-card').innerHTML = \`
            <div class="text-center p-8">
              <i class="fas fa-check-circle text-6xl text-green-500 mb-4 animate-bounce"></i>
              <h3 class="text-3xl font-bold mb-4 text-green-500">🎉 إجابة صحيحة!</h3>
              <div class="p-4 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded-xl">
                <p class="text-2xl font-black text-green-500">+\${response.data.points} نقطة</p>
              </div>
              <p class="text-gray-400 mt-6">عد غداً لسؤال جديد 🌟</p>
            </div>
          \`;
        } else {
          document.getElementById('answered-card').innerHTML = \`
            <div class="text-center p-8">
              <i class="fas fa-times-circle text-6xl text-red-500 mb-4 animate-bounce"></i>
              <h3 class="text-3xl font-bold mb-4 text-red-500">❌ إجابة خاطئة</h3>
              <div class="p-4 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded-xl mt-4">
                <p class="text-lg font-bold text-green-500 mb-2">الإجابة الصحيحة:</p>
                <p class="text-2xl font-black text-white">\${response.data.correctAnswer}</p>
              </div>
              <p class="text-gray-400 mt-6">عد غداً لسؤال جديد 🌟</p>
            </div>
          \`;
        }
        
        setTimeout(() => loadLeaderboard(), 3000);
      } catch (error) {
        console.error('Error submitting answer:', error);
      }
    }

    async function loadLeaderboard() {
      try {
        const response = await axios.get('/api/quiz/leaderboard');
        const container = document.getElementById('leaderboard-container');
        
        container.innerHTML = response.data.leaderboard.map((user, index) => {
          const icons = ['🥇', '🥈', '🥉'];
          const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-500'];
          
          return \`
            <div class="flex items-center justify-between p-4 rounded-xl \${index < 3 ? colors[index] : 'bg-gray-800'} bg-opacity-20 border-2 \${index < 3 ? 'border-' + colors[index].replace('bg-', '') : 'border-gray-700'}">
              <div class="flex items-center gap-3">
                <span class="text-2xl">\${index < 3 ? icons[index] : \`#\${index + 1}\`}</span>
                <span class="font-bold">\${user.name}</span>
              </div>
              <span class="text-xl font-black text-primary">\${user.points} نقطة</span>
            </div>
          \`;
        }).join('');
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      }
    }

    async function loadAdminDashboard() {
      try {
        const token = localStorage.getItem('koorax_token');
        const response = await axios.get('/api/admin/stats', {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        
        document.getElementById('total-users').textContent = response.data.totalUsers;
        document.getElementById('total-questions').textContent = response.data.totalQuestions;
        document.getElementById('today-answers').textContent = response.data.todayAnswers;
        
        await loadAnalytics();
        await loadParticipants();
      } catch (error) {
        console.error('Error loading admin dashboard:', error);
      }
    }
    
    async function loadAnalytics() {
      try {
        const token = localStorage.getItem('koorax_token');
        const response = await axios.get('/api/admin/analytics', {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        
        const data = response.data;
        
        // Success rate
        document.getElementById('correct-answers-percent').textContent = data.correctPercent + '%';
        document.getElementById('correct-answers-bar').style.width = data.correctPercent + '%';
        document.getElementById('wrong-answers-percent').textContent = data.wrongPercent + '%';
        document.getElementById('wrong-answers-bar').style.width = data.wrongPercent + '%';
        
        // Top participants
        const topHtml = data.topParticipants.map((user, idx) => \`
          <div class="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="text-xl">\${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}</span>
              <span class="font-semibold">\${user.name}</span>
            </div>
            <span class="text-primary font-bold">\${user.points} نقطة</span>
          </div>
        \`).join('');
        document.getElementById('top-participants').innerHTML = topHtml || '<p class="text-center text-gray-500">لا يوجد متسابقون</p>';
        
        // Activity
        document.getElementById('active-today').textContent = data.activeToday;
        document.getElementById('total-answers').textContent = data.totalAnswers;
        document.getElementById('avg-points').textContent = data.avgPoints;
        
        // Participation
        document.getElementById('participation-rate').textContent = data.participationRate + '%';
        document.getElementById('new-users').textContent = data.newUsers;
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    }

    async function loadParticipants() {
      try {
        const token = localStorage.getItem('koorax_token');
        const response = await axios.get('/api/admin/users', {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        
        const tbody = document.getElementById('participants-table');
        tbody.innerHTML = response.data.users.map(user => \`
          <tr class="border-b border-gray-700">
            <td class="p-3">\${user.name}</td>
            <td class="p-3">\${user.email}</td>
            <td class="p-3"><span class="text-primary font-bold">\${user.points}</span></td>
            <td class="p-3">\${new Date(user.created_at).toLocaleDateString('ar-EG')}</td>
            <td class="p-3">
              <button onclick="editUserPoints(\${user.id}, \${user.points}, '\${user.name}')" class="text-blue-500 hover:text-blue-300 mr-2">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteUser(\${user.id})" class="text-red-500 hover:text-red-300">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        \`).join('');
      } catch (error) {
        console.error('Error loading participants:', error);
      }
    }

    async function deleteUser(userId) {
      if (!confirm('هل تريد حذف هذا المستخدم؟')) return;
      
      try {
        const token = localStorage.getItem('koorax_token');
        await axios.delete(\`/api/admin/users/\${userId}\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        await loadParticipants();
        await loadAdminDashboard();
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
    
    async function editUserPoints(userId, currentPoints, userName) {
      const newPoints = prompt(\`تعديل نقاط \${userName}\nالنقاط الحالية: \${currentPoints}\n\nأدخل النقاط الجديدة:\`, currentPoints);
      
      if (newPoints === null) return; // User cancelled
      
      const points = parseInt(newPoints);
      if (isNaN(points) || points < 0) {
        showToast('الرجاء إدخال رقم صحيح موجب', 'error');
        return;
      }
      
      try {
        const token = localStorage.getItem('koorax_token');
        await axios.put(\`/api/admin/users/\${userId}/points\`, 
          { points }, 
          { headers: { Authorization: \`Bearer \${token}\` } }
        );
        showToast(\`تم تحديث نقاط \${userName} إلى \${points}\`, 'success');
        await loadParticipants();
        await loadAdminDashboard();
      } catch (error) {
        showToast('حدث خطأ أثناء تحديث النقاط', 'error');
      }
    }
    
    // Questions Management Functions
    async function loadQuestions() {
      try {
        const token = localStorage.getItem('koorax_token');
        const response = await axios.get('/api/admin/questions', {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        
        const table = document.getElementById('questions-table');
        table.innerHTML = response.data.questions.map(q => {
          const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          return \`
            <tr class="border-b border-gray-800 hover:bg-gray-800/50">
              <td class="p-3">\${q.id}</td>
              <td class="p-3">\${q.question_text.substring(0, 50)}...</td>
              <td class="p-3">\${q.correct_answer.toUpperCase()}</td>
              <td class="p-3">\${new Date(q.created_at).toLocaleDateString('ar-EG')}</td>
              <td class="p-3">
                <button onclick='editQuestion(\${JSON.stringify(q).replace(/'/g, "\\\\'")})'  class="text-blue-500 hover:text-blue-400 mr-2">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteQuestion(\${q.id})" class="text-red-500 hover:text-red-400">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          \`;
        }).join('');
      } catch (error) {
        console.error('Error loading questions:', error);
      }
    }
    
    function editQuestion(question) {
      const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
      
      document.getElementById('edit-q-id').value = question.id;
      document.getElementById('edit-q-text').value = question.question_text;
      document.getElementById('edit-q-a').value = options.a;
      document.getElementById('edit-q-b').value = options.b;
      document.getElementById('edit-q-c').value = options.c;
      document.getElementById('edit-q-d').value = options.d;
      document.getElementById('edit-q-correct').value = question.correct_answer.toLowerCase();
      
      document.getElementById('edit-modal').style.display = 'flex';
    }
    
    function closeEditModal() {
      document.getElementById('edit-modal').style.display = 'none';
    }
    
    async function handleUpdateQuestion(e) {
      e.preventDefault();
      
      const questionId = document.getElementById('edit-q-id').value;
      const question = {
        question_text: document.getElementById('edit-q-text').value,
        options: {
          a: document.getElementById('edit-q-a').value,
          b: document.getElementById('edit-q-b').value,
          c: document.getElementById('edit-q-c').value,
          d: document.getElementById('edit-q-d').value
        },
        correct_answer: document.getElementById('edit-q-correct').value
      };
      
      try {
        const token = localStorage.getItem('koorax_token');
        await axios.put(\`/api/admin/questions/\${questionId}\`, question, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        showToast('تم تحديث السؤال بنجاح', 'success');
        closeEditModal();
        await loadQuestions();
        await loadAdminDashboard();
      } catch (error) {
        showToast('حدث خطأ أثناء تحديث السؤال', 'error');
      }
    }
    
    async function deleteQuestion(questionId) {
      if (!confirm('هل أنت متأكد من حذف هذا السؤال؟ سيتم حذف جميع الإجابات المرتبطة به.')) {
        return;
      }
      
      try {
        const token = localStorage.getItem('koorax_token');
        await axios.delete(\`/api/admin/questions/\${questionId}\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        showToast('تم حذف السؤال بنجاح', 'success');
        await loadQuestions();
        await loadAdminDashboard();
      } catch (error) {
        showToast('حدث خطأ أثناء حذف السؤال', 'error');
      }
    }

    async function handleAddQuestion(e) {
      e.preventDefault();
      
      const question = {
        question_text: document.getElementById('q-text').value,
        options: {
          a: document.getElementById('q-a').value,
          b: document.getElementById('q-b').value,
          c: document.getElementById('q-c').value,
          d: document.getElementById('q-d').value
        },
        correct_answer: document.getElementById('q-correct').value
      };
      
      try {
        const token = localStorage.getItem('koorax_token');
        await axios.post('/api/admin/question', question, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        alert('تم إضافة السؤال بنجاح');
        e.target.reset();
        await loadAdminDashboard();
      } catch (error) {
        alert('حدث خطأ أثناء إضافة السؤال');
      }
    }

    function showMessage(elementId, message, type) {
      const el = document.getElementById(elementId);
      el.innerHTML = \`<p class="text-\${type === 'error' ? 'red' : 'green'}-500">\${message}</p>\`;
      setTimeout(() => el.innerHTML = '', 5000);
    }
    
    function handleQuizLogout() {
      if (confirm('هل تريد تسجيل الخروج؟')) {
        localStorage.removeItem('koorax_token');
        localStorage.removeItem('koorax_user');
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'none';
        document.getElementById('auth-section').style.display = 'block';
        showToast('تم تسجيل الخروج بنجاح', 'info');
      }
    }
    
    // Toast Notification System
    function showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = \`toast \${type}\`;
      
      const icons = {
        success: '<i class="fas fa-check-circle toast-icon"></i>',
        error: '<i class="fas fa-times-circle toast-icon"></i>',
        info: '<i class="fas fa-info-circle toast-icon"></i>'
      };
      
      toast.innerHTML = \`
        \${icons[type] || icons.success}
        <div class="toast-message">\${message}</div>
      \`;
      
      container.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }

    init();
    </script>
</body>
</html>
  `);
});

// Profile page
app.get('/profile', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - الملف الشخصي | إحصائياتك ونقاطك</title>
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
    
    ${getSEOTags({
      title: 'Koorax - الملف الشخصي | إحصائياتك ونقاطك',
      description: 'شاهد ملفك الشخصي، إحصائياتك، نقاطك، وترتيبك في لوحة المتصدرين. تابع تقدمك في مسابقة فزورة كرة القدم',
      keywords: 'ملف شخصي, إحصائيات, نقاط, ترتيب, لوحة متصدرين, كوراكس, profile, stats, leaderboard',
      url: 'https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai/profile',
      type: 'profile'
    })}
    
    <script type="application/ld+json">
    ${getSchemaOrg('ProfilePage')}
    </script>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
    <style>
    .profile-stat-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.3s ease;
    }
    .profile-stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(34, 197, 94, 0.2);
    }
    .answer-item {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      transition: all 0.3s ease;
    }
    .answer-item:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .answer-correct {
      border-left: 4px solid #22c55e;
    }
    .answer-wrong {
      border-left: 4px solid #ef4444;
    }
    </style>
</head>
<body class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white">
    <script src="/static/koorax-global.js"></script>
    <script>
      document.write(getEnhancedHeader('profile'));
    </script>

    <div class="container mx-auto px-4 py-8 max-w-6xl" id="profile-content" style="display: none;">
      <!-- Logout Button -->
      <div class="flex justify-end mb-4">
        <button onclick="handleLogout()" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-all">
          <i class="fas fa-sign-out-alt mr-2"></i>
          تسجيل الخروج
        </button>
      </div>
      
      <!-- Profile Header -->
      <div class="glass-card p-8 mb-6">
        <div class="flex items-center gap-6">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-4xl font-bold">
            <span id="user-initial">U</span>
          </div>
          <div class="flex-1">
            <h1 class="text-3xl font-bold mb-2" id="user-name-profile">جاري التحميل...</h1>
            <p class="text-gray-400" id="user-email-profile">---</p>
            <p class="text-sm text-gray-500 mt-2">
              <i class="fas fa-calendar-alt mr-2"></i>
              <span>انضم في: </span>
              <span id="joined-date">---</span>
            </p>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-primary" id="user-rank-profile">--</div>
            <div class="text-sm text-gray-400">الترتيب</div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="profile-stat-card text-center">
          <div class="text-4xl mb-2">🏆</div>
          <div class="text-3xl font-bold text-primary" id="total-points">0</div>
          <div class="text-sm text-gray-400">إجمالي النقاط</div>
        </div>
        <div class="profile-stat-card text-center">
          <div class="text-4xl mb-2">✅</div>
          <div class="text-3xl font-bold text-green-500" id="correct-answers">0</div>
          <div class="text-sm text-gray-400">إجابات صحيحة</div>
        </div>
        <div class="profile-stat-card text-center">
          <div class="text-4xl mb-2">❌</div>
          <div class="text-3xl font-bold text-red-500" id="wrong-answers">0</div>
          <div class="text-sm text-gray-400">إجابات خاطئة</div>
        </div>
        <div class="profile-stat-card text-center">
          <div class="text-4xl mb-2">📊</div>
          <div class="text-3xl font-bold text-blue-500"><span id="success-rate">0</span>%</div>
          <div class="text-sm text-gray-400">معدل النجاح</div>
        </div>
      </div>

      <!-- Progress Chart -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-chart-line text-primary mr-2"></i>
          تقدمك
        </h2>
        <canvas id="progressChart"></canvas>
      </div>

      <!-- Recent Answers -->
      <div class="glass-card p-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-history text-primary mr-2"></i>
          آخر الإجابات
        </h2>
        <div id="recent-answers-container">
          <p class="text-center text-gray-400 py-8">جاري التحميل...</p>
        </div>
      </div>
    </div>

    <script>
    let profileChart = null;

    async function loadProfile() {
      try {
        const token = localStorage.getItem('koorax_token');
        if (!token) {
          window.location.href = '/';
          return;
        }

        const response = await axios.get('/api/user/profile', {
          headers: { Authorization: \`Bearer \${token}\` }
        });

        const { user, stats, recentAnswers } = response.data;

        // Update user info
        document.getElementById('user-name-profile').textContent = user.name;
        document.getElementById('user-email-profile').textContent = user.email;
        document.getElementById('user-initial').textContent = user.name.charAt(0).toUpperCase();
        document.getElementById('user-rank-profile').textContent = '#' + user.rank;
        document.getElementById('joined-date').textContent = new Date(user.joinedAt).toLocaleDateString('ar-EG');

        // Update stats
        document.getElementById('total-points').textContent = user.points;
        document.getElementById('correct-answers').textContent = stats.correctAnswers;
        document.getElementById('wrong-answers').textContent = stats.wrongAnswers;
        document.getElementById('success-rate').textContent = stats.successRate;

        // Render chart
        renderChart(stats);

        // Render recent answers
        renderRecentAnswers(recentAnswers);

      } catch (error) {
        console.error('Load profile error:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Token invalid or expired, clear and redirect
          localStorage.removeItem('koorax_token');
          localStorage.removeItem('koorax_user');
          window.location.href = '/';
        }
      }
    }

    function renderChart(stats) {
      const ctx = document.getElementById('progressChart').getContext('2d');
      
      if (profileChart) {
        profileChart.destroy();
      }

      profileChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['إجابات صحيحة', 'إجابات خاطئة'],
          datasets: [{
            data: [stats.correctAnswers, stats.wrongAnswers],
            backgroundColor: ['#22c55e', '#ef4444'],
            borderColor: ['#16a34a', '#dc2626'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#fff',
                font: { size: 14 },
                padding: 20
              }
            }
          }
        }
      });
    }

    function renderRecentAnswers(answers) {
      const container = document.getElementById('recent-answers-container');
      
      if (answers.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">لا توجد إجابات بعد</p>';
        return;
      }

      container.innerHTML = answers.map(answer => \`
        <div class="answer-item \${answer.is_correct ? 'answer-correct' : 'answer-wrong'}">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <i class="fas \${answer.is_correct ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}"></i>
                <span class="font-bold">\${answer.question_text}</span>
              </div>
              <div class="text-sm text-gray-400">
                <span>الإجابة: \${answer.answer.toUpperCase()}</span>
                <span class="mx-2">•</span>
                <span>\${answer.is_correct ? '+' + answer.points_earned + ' نقطة' : '0 نقطة'}</span>
              </div>
            </div>
            <div class="text-xs text-gray-500">
              \${new Date(answer.answered_at).toLocaleDateString('ar-EG')}
            </div>
          </div>
        </div>
      \`).join('');
    }

    function handleLogout() {
      if (confirm('هل تريد تسجيل الخروج؟')) {
        localStorage.removeItem('koorax_token');
        localStorage.removeItem('koorax_user');
        window.location.href = '/quiz';
      }
    }

    // Check authentication first (immediate redirect if not logged in)
    function checkAuth() {
      const token = localStorage.getItem('koorax_token');
      if (!token) {
        // Redirect immediately without showing any content
        window.location.href = '/';
        return false;
      }
      return true;
    }

    // Initialize
    async function init() {
      // Check auth immediately (synchronous)
      if (!checkAuth()) {
        return; // Stop execution if not authenticated
      }
      
      // Only show content if authenticated
      document.getElementById('profile-content').style.display = 'block';
      await loadProfile();
    }
    
    // Run immediately
    init();
    </script>
</body>
</html>
  `);
});

// ===== SEO Routes =====

// Robots.txt
app.get('/robots.txt', (c) => {
  return c.text(`User-agent: *
Allow: /
Allow: /quiz
Allow: /matches
Disallow: /api/
Disallow: /profile

Sitemap: https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai/sitemap.xml
`);
});

// Sitemap.xml
app.get('/sitemap.xml', (c) => {
  const baseUrl = 'https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai';
  const currentDate = new Date().toISOString().split('T')[0];
  
  return c.text(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/quiz</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/matches</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/profile</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  
</urlset>`, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
});

export default app;
