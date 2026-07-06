const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { v4: uuidv4 } = require('uuid');

module.exports = function(passport, db) {
  // Read environment variables with fallbacks for debugging
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  console.log('Google OAuth Configuration Check:');
  console.log('  GOOGLE_CLIENT_ID:', clientID ? '✓ Present' : '❌ MISSING');
  console.log('  GOOGLE_CLIENT_SECRET:', clientSecret ? '✓ Present' : '❌ MISSING');
  console.log('  GOOGLE_CALLBACK_URL:', callbackURL || '❌ MISSING');

  if (!clientID || !clientSecret || !callbackURL) {
    console.error('❌ Google OAuth credentials missing. Please check your .env file.');
    return; // Don't initialize the strategy
  }

  passport.use(new GoogleStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Your existing logic to find or create user
      let user = await db('users').where({ google_id: profile.id }).first();
      if (!user) {
        const email = profile.emails[0].value;
        user = await db('users').where({ email }).first();
        if (user) {
          await db('users').where({ id: user.id }).update({ google_id: profile.id });
        } else {
          const firstClinic = await db('clinics').first();
          const id = uuidv4();
          await db('users').insert({
            id,
            google_id: profile.id,
            email,
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            role: 'CLINIC_ADMIN',
            clinic_id: firstClinic?.id || null,
            is_active: true,
            password_hash: ''
          });
          user = await db('users').where({ id }).first();
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
  
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await db('users').where({ id }).first();
    done(null, user);
  });
};