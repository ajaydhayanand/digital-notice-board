const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedDefaults = async () => {
  const accounts = [
    {
      username: "admin",
      password: "admin123",
      role: "admin",
    },
    {
      username: "student",
      password: "student123",
      role: "user",
    },
  ];

  for (const account of accounts) {
    const existing = await User.findOne({ username: account.username });
    if (existing) {
      if (existing.role !== account.role) {
        existing.role = account.role;
        await existing.save();
      }
      continue;
    }

    const password = await bcrypt.hash(account.password, 10);
    await User.create({
      username: account.username,
      password,
      role: account.role,
    });
  }
};

module.exports = {
  seedDefaults,
};
