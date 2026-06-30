const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config();

const email = process.argv[2]?.trim(); //grabs the email address passed directly from the terminal command

const makeAdmin = async () => {
  if (!email) {
    console.error('Usage: npm run make-admin -- user@example.com');
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    //Database operations are asynchronous; await pauses the script execution until the connection is successfully opened.
    const user = await User.findOneAndUpdate(
      { email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { role: 'admin' },
      { new: true }
    ).select('-password');

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exitCode = 1;
      return;
    }

    console.log(`${user.email} is now an admin.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

makeAdmin();


// new RegExp(...): Initializes a new JavaScript regular expression object.
// ^ and $: Start and End anchors that ensure the match is an exact match for the entire email, not just a substring.${email.replace(...)}: Escapes any special regex characters (like ., +, ?, or *) in the email string so they are treated as literal characters.'i': Makes the search case-insensitive.

