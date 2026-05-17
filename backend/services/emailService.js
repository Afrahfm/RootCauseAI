export const sendResetEmail = async (email, resetToken) => {
  const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
  console.log('----------------------------------------');
  console.log(`MOCK EMAIL SENT TO: ${email}`);
  console.log(`SUBJECT: Password Reset Request`);
  console.log(`BODY: Click the link to reset your password: ${resetLink}`);
  console.log('----------------------------------------');
  return true;
};
