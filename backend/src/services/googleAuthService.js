const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function(passport, db) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  console.log('Google OAuth Configuration Check:');
  console.log('  GOOGLE_CLIENT_ID:', clientID ? '✓ Present' : '❌ MISSING');
  console.log('  GOOGLE_CLIENT_SECRET:', clientSecret ? '✓ Present' : '❌ MISSING');
  console.log('  GOOGLE_CALLBACK_URL:', callbackURL || '❌ MISSING');

  if (!clientID || !clientSecret || !callbackURL) {
    console.error('❌ Google OAuth credentials missing.');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      console.log('🔍 Google login attempt:', email);

      // Find user by google_id
      let user = await db('users').where({ google_id: profile.id }).first();
      
      if (user) {
        console.log('✅ Found by google_id:', user.email, 'Role:', user.role);
        return done(null, user);
      }

      // Find user by email (existing account, first Google login)
      user = await db('users').where({ email }).first();
      
      if (user) {
        // Link Google ID to existing account
        await db('users').where({ id: user.id }).update({ google_id: profile.id });
        console.log('✅ Linked Google to existing user:', user.email, 'Role:', user.role);
        return done(null, user);
      }

      // User not found - reject. Only super admin can create accounts.
      console.log('❌ Unknown user rejected:', email);
      return done(null, false, { message: 'Account not found. Contact your administrator.' });

    } catch (err) {
      console.error('❌ Google strategy error:', err);
      return done(err, null);
    }
  }));
  
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await db('users').where({ id }).first();
    done(null, user);
  });
};