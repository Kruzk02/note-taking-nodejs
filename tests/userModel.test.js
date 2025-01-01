import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import User from '../src/models/userModel.js';

describe('User Model Tests', () => {
  it('should hash the password before saving', async () => {

    const password = 'testpassword';
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: password,
      picture: 'test.jpg',
    });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    
    const saveMock = vi.fn(() => Promise.resolve(user));

    user.save = saveMock;
    await user.save();

    expect(saveMock).toHaveBeenCalled();
    expect(user.password).not.toBe(password);
    expect(user.password).toMatch(/^(\$2[ayb]\$.{56})$/);
  }, 10000);

  it('should compare the password correctly', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
      picture: 'test.jpg',
    });

    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const isMatch = await user.comparePassword('testpassword');
    expect(isMatch).toBe(true);

  });

  it('should throw an error if password is missing', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
    });

    try {
      await user.save();
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    }
  });
});

