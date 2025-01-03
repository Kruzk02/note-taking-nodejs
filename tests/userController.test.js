import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, register, getUserDetails } from '../src/controllers/userController.js';
import User from '../src/models/userModel.js';
import jsonwebtoken from 'jsonwebtoken';

vi.mock('../src/models/userModel.js');

vi.mock('../src/utils/requestBody.js', () => ({
__esModule: true,
  default: vi.fn().mockResolvedValue({ email: 'test@example.com', password: '123456' }), 
}));

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { on: vi.fn(), method: 'POST', url: '' };
    res = {
      writeHead: vi.fn(),
      end: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should return 401 if user is not found', async () => {
      User.findOne.mockResolvedValue(null);
      const mockBody = { email: 'test@example.com', password: '123456' };
      import('../src/utils/requestBody.js').then(({ default: getRequestBody }) => {
        getRequestBody.mockResolvedValue(mockBody);
      });

      await login(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(401, {"Content-Type" : "application/json"});
      expect(res.end).toHaveBeenCalledWith(
        JSON.stringify({ message: 'Invalid email or password' })
      );
    });

    it('should return 401 if password is incorrect', async () => {
      User.findOne.mockResolvedValue(null);

      const mockBody = { email: 'test@example.com', password: '123456' };
      import('../src/utils/requestBody.js').then(({ default: getRequestBody }) => {
        getRequestBody.mockResolvedValue(mockBody);
      });

      await login(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(401, {"Content-Type" : "application/json"});
      expect(res.end).toHaveBeenCalledWith(
        JSON.stringify({ message: 'Invalid email or password' })
      );
    });

    it('should return 200 if login is successful', async () => {
      const mockUser = {
        id: '123aaabbb',
        email: 'test@example.com',
        password: '123456',
        comparePassword: vi.fn().mockResolvedValue(true),
        toObject: vi.fn().mockReturnValue({ email: 'test@example.com' }),
      };
      User.findOne.mockResolvedValue(mockUser);

      const mockBody = { email: 'test@example.com', password: '123456' };
      import('../src/utils/requestBody.js').then(({ default: getRequestBody }) => {
        getRequestBody.mockResolvedValue(mockBody);
      });

      if (!process.env.JWT_SECRET_KEY) {
        process.env.JWT_SECRET_KEY = "VERYSECRETKEY";
      }
      let jwtSecretKey = process.env.JWT_SECRET_KEY;

      let data = {
        time: Date(),
        username: mockUser.username
      }

      const token = jsonwebtoken.sign(data, jwtSecretKey, {expiresIn: '1h'});
      await login(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(200, { "Content-Type" : "application/json" });
      expect(res.end).toHaveBeenCalledWith(
        JSON.stringify({ message: 'Login successful', token})
      );
    });
  });

  describe('register', () => {
    it('should return 400 if email is already taken', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });
      
      const mockBody = { username: 'Test', email: 'test@example.com', password: '123456' };
      import('../src/utils/requestBody.js').then(({ default: getRequestBody }) => {
        getRequestBody.mockResolvedValue(mockBody);
      });

      await register(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(400, { "Content-Type" : "application/json" });
      expect(res.end).toHaveBeenCalledWith(
        JSON.stringify({ message: 'Email already taken' })
      );
    });

    it('should return 201 if registration is successful', async () => {
      User.findOne.mockResolvedValue(null);
      const mockBody = { username: 'Test', email: 'test@example.com', password: '123456' };
      const mockUser = { save: vi.fn() };

      User.mockImplementation(() => mockUser); 
      import('../src/utils/requestBody.js').then(({ default: getRequestBody }) => {
        getRequestBody.mockResolvedValue(mockBody);
      });

      await register(req, res);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(201, {"Content-Type" : "application/json"});
      expect(res.end).toHaveBeenCalledWith(
        JSON.stringify({ message: 'User registered successfully', user: mockUser })
      );
    });
  });

  describe('getUserDetails', () => {
    it('should return 400 if authorization header is missing', async () => {
      const req = { headers: {} };
      const res = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      await getUserDetails(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(400, { "Content-Type": "application/json" });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: "Authorization header missing", error: null}));
    });

    it('should return 400 if token is missing', async () => {
      const req = { headers: { authorization: `Bearer `} };
      const res = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      await getUserDetails(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(400, { "Content-Type": "application/json" });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: "Token missing", error: null }));
    });

    it('should return 200 with the username if token is valid', async () => {
      const req = { headers: { authorization : `Bearer validToken`} };
      const res = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };
      const decodedToken = { username: 'testUser' };
      vi.spyOn(jsonwebtoken, 'verify').mockReturnValue(decodedToken);

      await getUserDetails(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(200, { "Content-Type": "application/json" });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ username: 'testUser' }));    
    });
  });
});
