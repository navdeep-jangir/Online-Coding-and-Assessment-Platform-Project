import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import ApiError from '../../src/utils/ApiError.js';
import asyncHandler from '../../src/utils/asyncHandler.js';
import slugify from '../../src/utils/slugify.js';
import validate from '../../src/middleware/validate.js';
import errorHandler from '../../src/middleware/errorHandler.js';
import { authorize } from '../../src/middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  updateProfileValidation,
} from '../../src/validators/auth.js';

const createValidationApp = (chains) => {
  const app = express();
  app.use(express.json());
  app.post('/test', chains, validate, (req, res) => {
    res.status(200).json({ success: true, body: req.body });
  });
  app.use(errorHandler);
  return app;
};

describe('Utilities', () => {
  it('ApiError stores statusCode, message, success=false, and errors', () => {
    const err = new ApiError(404, 'Resource missing', [{ field: 'id', message: 'bad' }]);
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(404);
    expect(err.status).toBe('fail');
    expect(err.success).toBe(false);
    expect(err.message).toBe('Resource missing');
    expect(err.errors).toEqual([{ field: 'id', message: 'bad' }]);
  });

  it('asyncHandler forwards rejected promises to next', async () => {
    const boom = new ApiError(400, 'Boom');
    const handler = asyncHandler(async () => {
      throw boom;
    });
    const next = vi.fn();
    await handler({}, {}, next);
    expect(next).toHaveBeenCalledWith(boom);
  });

  it('slugify converts titles cleanly', () => {
    expect(slugify('Arrays & Hashing (Basics)!')).toBe('arrays-hashing-basics');
  });
});

describe('Auth Validators', () => {
  it('registerValidation accepts valid student payload', async () => {
    const app = createValidationApp(registerValidation);
    const res = await request(app).post('/test').send({
      name: 'Ada Lovelace',
      email: 'Ada@Example.COM',
      password: 'Password1',
      collegeName: 'University of London',
      preferredLanguage: 'python',
    });
    expect(res.status).toBe(200);
    expect(res.body.body.email).toBe('ada@example.com');
  });

  it('registerValidation rejects weak password, short name, bad email, invalid language', async () => {
    const app = createValidationApp(registerValidation);
    const res = await request(app).post('/test').send({
      name: 'A',
      email: 'not-an-email',
      password: 'weak',
      collegeName: 'X',
      preferredLanguage: 'ruby',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('loginValidation requires email and password', async () => {
    const app = createValidationApp(loginValidation);
    const res = await request(app).post('/test').send({ email: 'bad', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('changePasswordValidation enforces strong newPassword', async () => {
    const app = createValidationApp(changePasswordValidation);
    const failRes = await request(app)
      .post('/test')
      .send({ currentPassword: 'OldPassword1', newPassword: 'lowercase1' });
    expect(failRes.status).toBe(400);

    const okRes = await request(app)
      .post('/test')
      .send({ currentPassword: 'OldPassword1', newPassword: 'NewPassword1' });
    expect(okRes.status).toBe(200);
  });

  it('updateProfileValidation allows optional partial updates and validates values', async () => {
    const app = createValidationApp(updateProfileValidation);
    const okRes = await request(app)
      .post('/test')
      .send({ preferredLanguage: 'cpp' });
    expect(okRes.status).toBe(200);

    const failRes = await request(app)
      .post('/test')
      .send({ preferredLanguage: 'rust' });
    expect(failRes.status).toBe(400);
  });

  it('authorize middleware returns 403 for non-matching roles', () => {
    const next = vi.fn();
    authorize('admin')({ user: { role: 'student' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
