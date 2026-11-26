import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import mongoose from 'mongoose';

// In-memory mock stores so all Express routers, middleware, and controllers run end-to-end.
const stores = {
  users: [],
  modules: [],
  topics: [],
  progress: [],
  notes: [],
  bookmarks: [],
};

const wrapDoc = (collection, item) => ({
  ...item,
  toObject() {
    return { ...this };
  },
  async save() {
    const idx = stores[collection].findIndex((d) => String(d._id) === String(this._id));
    if (idx >= 0) {
      stores[collection][idx] = { ...this };
    }
    return this;
  },
  async deleteOne() {
    stores[collection] = stores[collection].filter((d) => String(d._id) !== String(this._id));
  },
});

const makeQuery = (resultOrResolver) => {
  const query = {
    _lean: false,
    _populate: [],
    select() {
      return query;
    },
    sort(sortSpec) {
      this._sort = sortSpec;
      return query;
    },
    populate(path) {
      this._populate.push(path);
      return query;
    },
    lean() {
      this._lean = true;
      return query;
    },
    then(resolve, reject) {
      return Promise.resolve()
        .then(() =>
          typeof resultOrResolver === 'function' ? resultOrResolver(query) : resultOrResolver
        )
        .then(resolve, reject);
    },
  };
  return query;
};

const matches = (doc, filter = {}) =>
  Object.entries(filter).every(([key, val]) => {
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof mongoose.Types.ObjectId)) {
      if ('$ne' in val) return doc[key] !== val.$ne;
      if ('$in' in val) return val.$in.map(String).includes(String(doc[key]));
      if ('$gt' in val) return doc[key] && new Date(doc[key]).getTime() > Number(val.$gt);
    }
    return String(doc[key]) === String(val);
  });

vi.mock('../../src/models/User.js', () => ({
  default: {
    findOne: (filter) =>
      makeQuery(() => {
        const found = stores.users.find((u) => matches(u, filter));
        return found ? wrapDoc('users', found) : null;
      }),
    findById: (id) =>
      makeQuery(() => {
        const found = stores.users.find((u) => String(u._id) === String(id));
        return found ? wrapDoc('users', found) : null;
      }),
    create: async (data) => {
      const doc = { _id: new mongoose.Types.ObjectId(), isActive: true, preferredLanguage: 'cpp', ...data };
      stores.users.push(doc);
      return wrapDoc('users', doc);
    },
    findByIdAndUpdate: (id, update) =>
      makeQuery(() => {
        const idx = stores.users.findIndex((u) => String(u._id) === String(id));
        if (idx === -1) return null;
        stores.users[idx] = { ...stores.users[idx], ...(update.$set || update) };
        return wrapDoc('users', stores.users[idx]);
      }),
  },
}));

vi.mock('../../src/models/Module.js', () => ({
  default: {
    find: (filter = {}) =>
      makeQuery((q) => {
        let items = stores.modules.filter((m) => matches(m, filter));
        if (q._sort?.order) {
          items = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        return items.map((i) => (q._lean ? { ...i } : wrapDoc('modules', i)));
      }),
    findOne: (filter) =>
      makeQuery((q) => {
        const found = stores.modules.find((m) => matches(m, filter));
        return found ? (q._lean ? { ...found } : wrapDoc('modules', found)) : null;
      }),
    findById: (id) =>
      makeQuery((q) => {
        const found = stores.modules.find((m) => String(m._id) === String(id));
        return found ? (q._lean ? { ...found } : wrapDoc('modules', found)) : null;
      }),
    create: async (data) => {
      const doc = { _id: new mongoose.Types.ObjectId(), isArchived: false, isPublished: true, order: 0, ...data };
      stores.modules.push(doc);
      return wrapDoc('modules', doc);
    },
  },
}));

vi.mock('../../src/models/Topic.js', () => ({
  default: {
    find: (filter = {}) =>
      makeQuery((q) => {
        let items = stores.topics.filter((t) => matches(t, filter));
        if (q._sort?.order) {
          items = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        return items.map((i) => (q._lean ? { ...i } : wrapDoc('topics', i)));
      }),
    findOne: (filter) =>
      makeQuery((q) => {
        const found = stores.topics.find((t) => matches(t, filter));
        return found ? (q._lean ? { ...found } : wrapDoc('topics', found)) : null;
      }),
    findById: (id) =>
      makeQuery((q) => {
        const found = stores.topics.find((t) => String(t._id) === String(id));
        return found ? (q._lean ? { ...found } : wrapDoc('topics', found)) : null;
      }),
    create: async (data) => {
      const doc = { _id: new mongoose.Types.ObjectId(), isArchived: false, resources: [], order: 0, ...data };
      stores.topics.push(doc);
      return wrapDoc('topics', doc);
    },
    findByIdAndDelete: async (id) => {
      const idx = stores.topics.findIndex((t) => String(t._id) === String(id));
      if (idx === -1) return null;
      const [removed] = stores.topics.splice(idx, 1);
      return removed;
    },
  },
}));

vi.mock('../../src/models/UserProgress.js', () => ({
  default: {
    find: (filter = {}) =>
      makeQuery(() => stores.progress.filter((p) => matches(p, filter)).map((p) => ({ ...p }))),
    findOne: (filter) =>
      makeQuery((q) => {
        const found = stores.progress.find((p) => matches(p, filter));
        return found ? (q._lean ? { ...found } : wrapDoc('progress', found)) : null;
      }),
    create: async (data) => {
      const doc = { _id: new mongoose.Types.ObjectId(), ...data };
      stores.progress.push(doc);
      return wrapDoc('progress', doc);
    },
    deleteMany: async (filter) => {
      stores.progress = stores.progress.filter((p) => !matches(p, filter));
    },
  },
}));

vi.mock('../../src/models/Note.js', () => ({
  default: {
    findOne: (filter) =>
      makeQuery((q) => {
        const found = stores.notes.find((n) => matches(n, filter));
        return found ? (q._lean ? { ...found } : wrapDoc('notes', found)) : null;
      }),
    findById: (id) =>
      makeQuery((q) => {
        const found = stores.notes.find((n) => String(n._id) === String(id));
        return found ? (q._lean ? { ...found } : wrapDoc('notes', found)) : null;
      }),
    create: async (data) => {
      const doc = { _id: new mongoose.Types.ObjectId(), ...data };
      stores.notes.push(doc);
      return wrapDoc('notes', doc);
    },
    deleteMany: async (filter) => {
      stores.notes = stores.notes.filter((n) => !matches(n, filter));
    },
  },
}));

vi.mock('../../src/models/Bookmark.js', () => ({
  BOOKMARK_MODEL_MAP: {
    topic: 'Topic',
    note: 'Note',
    module: 'Module',
    problem: 'Problem',
  },
  default: {
    find: (filter = {}) =>
      makeQuery(() => stores.bookmarks.filter((b) => matches(b, filter)).map((b) => wrapDoc('bookmarks', b))),
    findOne: (filter) =>
      makeQuery((q) => {
        const found = stores.bookmarks.find((b) => matches(b, filter));
        return found ? (q._lean ? { ...found } : wrapDoc('bookmarks', found)) : null;
      }),
    create: async (data) => {
      const doc = { _id: new mongoose.Types.ObjectId(), ...data };
      stores.bookmarks.push(doc);
      return wrapDoc('bookmarks', doc);
    },
    deleteMany: async (filter) => {
      stores.bookmarks = stores.bookmarks.filter((b) => !matches(b, filter));
    },
    populate: async (docs) => {
      for (const doc of docs) {
        if (doc.targetModel === 'Topic') {
          doc.targetId = stores.topics.find((t) => String(t._id) === String(doc.targetId)) || null;
        } else if (doc.targetModel === 'Note') {
          doc.targetId = stores.notes.find((n) => String(n._id) === String(doc.targetId)) || null;
        } else if (doc.targetModel === 'Module') {
          doc.targetId = stores.modules.find((m) => String(m._id) === String(doc.targetId)) || null;
        }
      }
      return docs;
    },
  },
}));

import authRoutes from '../../src/routes/authRoutes.js';
import moduleRoutes from '../../src/routes/moduleRoutes.js';
import topicRoutes from '../../src/routes/topicRoutes.js';
import noteRoutes from '../../src/routes/noteRoutes.js';
import bookmarkRoutes from '../../src/routes/bookmarkRoutes.js';
import errorHandler from '../../src/middleware/errorHandler.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/modules', moduleRoutes);
  app.use('/api/topics', topicRoutes);
  app.use('/api/notes', noteRoutes);
  app.use('/api/bookmarks', bookmarkRoutes);
  app.use(errorHandler);
  return app;
};

describe('CodeClimb Auth & Curriculum API Integration', () => {
  let app;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';
    stores.users = [];
    stores.modules = [];
    stores.topics = [];
    stores.progress = [];
    stores.notes = [];
    stores.bookmarks = [];
    app = buildApp();
  });

  it('handles full auth lifecycle: register (blocks role=admin), cookie, me, profile, password, forgot/reset, logout', async () => {
    const agent = request.agent(app);

    const regRes = await agent.post('/api/auth/register').send({
      name: 'Student One',
      email: 'student@codeclimb.dev',
      password: 'Password1',
      collegeName: 'IIT Delhi',
      preferredLanguage: 'cpp',
      role: 'admin',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.role).toBe('student');
    expect(regRes.body.data.user.password).toBeUndefined();
    const setCookie = regRes.headers['set-cookie'][0];
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Path=/');

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('student@codeclimb.dev');

    const updRes = await agent.put('/api/auth/update-profile').send({
      name: 'Student Updated',
      preferredLanguage: 'python',
      role: 'admin',
    });
    expect(updRes.status).toBe(200);
    expect(updRes.body.data.user.name).toBe('Student Updated');
    expect(updRes.body.data.user.preferredLanguage).toBe('python');
    expect(updRes.body.data.user.role).toBe('student');

    const badPass = await agent.put('/api/auth/change-password').send({
      currentPassword: 'WrongPassword1',
      newPassword: 'NewPassword2',
    });
    expect(badPass.status).toBe(401);

    const chgPass = await agent.put('/api/auth/change-password').send({
      currentPassword: 'Password1',
      newPassword: 'NewPassword2',
    });
    expect(chgPass.status).toBe(200);

    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'student@codeclimb.dev' });
    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.data.resetToken).toBeTruthy();

    const resetRes = await request(app)
      .put(`/api/auth/reset-password/${forgotRes.body.data.resetToken}`)
      .send({ password: 'ResetPassword3' });
    expect(resetRes.status).toBe(200);

    const loginRes = await agent.post('/api/auth/login').send({
      email: 'student@codeclimb.dev',
      password: 'ResetPassword3',
    });
    expect(loginRes.status).toBe(200);

    const logoutRes = await agent.get('/api/auth/logout');
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers['set-cookie'][0]).toContain('token=;');

    const unauthMe = await request(app).get('/api/auth/me');
    expect(unauthMe.status).toBe(401);
  });

  it('enforces admin RBAC and manages modules, topics, progress, notes, and bookmarks', async () => {
    const studentAgent = request.agent(app);
    await studentAgent.post('/api/auth/register').send({
      name: 'Regular Student',
      email: 'stud@codeclimb.dev',
      password: 'Password1',
      collegeName: 'NIT Trichy',
      preferredLanguage: 'java',
    });

    const forbiddenMod = await studentAgent.post('/api/modules').send({ title: 'Arrays' });
    expect(forbiddenMod.status).toBe(403);

    // Promote an admin directly in store and log in
    const adminAgent = request.agent(app);
    await adminAgent.post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@codeclimb.dev',
      password: 'Password1',
      collegeName: 'CodeClimb HQ',
    });
    stores.users.find((u) => u.email === 'admin@codeclimb.dev').role = 'admin';

    const modRes = await adminAgent.post('/api/modules').send({
      title: 'Arrays and Hashing',
      order: 1,
      difficulty: 'beginner',
    });
    expect(modRes.status).toBe(201);
    const moduleId = modRes.body.data._id;

    const topicRes = await adminAgent.post('/api/topics').send({
      module: moduleId,
      title: 'Two Sum Patterns',
      order: 1,
      resources: [{ title: 'Guide', url: 'https://example.com', type: 'article' }],
    });
    expect(topicRes.status).toBe(201);
    const topicId = topicRes.body.data._id;

    // Student marks topic complete
    const progOn = await studentAgent.put(`/api/topics/${topicId}/progress`).send({});
    expect(progOn.status).toBe(200);
    expect(progOn.body.data.completed).toBe(true);

    // Modules list reflects topicCount and user progress
    const modsList = await studentAgent.get('/api/modules');
    expect(modsList.status).toBe(200);
    expect(modsList.body.data[0].topicCount).toBe(1);
    expect(modsList.body.data[0].progress.percentage).toBe(100);

    // Single module, update module, topics list, single topic, update topic
    const singleMod = await studentAgent.get(`/api/modules/${moduleId}`);
    expect(singleMod.status).toBe(200);
    expect(singleMod.body.data.topics).toHaveLength(1);
    expect(singleMod.body.data.topics[0].isCompleted).toBe(true);

    const updMod = await adminAgent.put(`/api/modules/${moduleId}`).send({ order: 2 });
    expect(updMod.status).toBe(200);
    expect(updMod.body.data.order).toBe(2);

    const topicsList = await studentAgent.get(`/api/topics?module=${moduleId}`);
    expect(topicsList.status).toBe(200);
    expect(topicsList.body.data).toHaveLength(1);
    expect(topicsList.body.data[0].isCompleted).toBe(true);

    const singleTopic = await studentAgent.get(`/api/topics/${topicId}`);
    expect(singleTopic.status).toBe(200);
    expect(singleTopic.body.data.resources).toHaveLength(1);
    expect(singleTopic.body.data.progress.isCompleted).toBe(true);

    const updTopic = await adminAgent
      .put(`/api/topics/${topicId}`)
      .send({ estimatedMinutes: 45 });
    expect(updTopic.status).toBe(200);
    expect(updTopic.body.data.estimatedMinutes).toBe(45);

    // Toggle topic progress off
    const progOff = await studentAgent.put(`/api/topics/${topicId}/progress`).send({});
    expect(progOff.body.data.completed).toBe(false);

    // Admin creates and updates note
    const noteRes = await adminAgent.post('/api/notes').send({
      topic: topicId,
      title: 'Hash Map Lookup Notes',
      content: '# Two Sum\nUse a hash map for O(n) lookup.',
    });
    expect(noteRes.status).toBe(201);
    const noteId = noteRes.body.data._id;

    const updNoteRes = await adminAgent.put(`/api/notes/${noteId}`).send({
      summary: 'O(n) time, O(n) space',
    });
    expect(updNoteRes.status).toBe(200);

    const getNoteRes = await request(app).get(`/api/notes/topic/${topicId}`);
    expect(getNoteRes.status).toBe(200);
    expect(getNoteRes.body.data.summary).toBe('O(n) time, O(n) space');

    // Bookmarks toggle, check, filter, and populate
    const missingId = new mongoose.Types.ObjectId();
    const bmNotFound = await studentAgent
      .post('/api/bookmarks/toggle')
      .send({ type: 'topic', targetId: missingId });
    expect(bmNotFound.status).toBe(404);

    const bmToggle1 = await studentAgent
      .post('/api/bookmarks/toggle')
      .send({ type: 'topic', targetId: topicId });
    expect(bmToggle1.status).toBe(201);
    expect(bmToggle1.body.data.bookmarked).toBe(true);

    const bmCheck = await studentAgent.get(`/api/bookmarks/check?type=topic&targetId=${topicId}`);
    expect(bmCheck.status).toBe(200);
    expect(bmCheck.body.data.bookmarked).toBe(true);

    const bmList = await studentAgent.get('/api/bookmarks?type=topic');
    expect(bmList.status).toBe(200);
    expect(bmList.body.data).toHaveLength(1);
    expect(bmList.body.data[0].targetId.title).toBe('Two Sum Patterns');

    const bmToggle2 = await studentAgent
      .post('/api/bookmarks/toggle')
      .send({ type: 'topic', targetId: topicId });
    expect(bmToggle2.status).toBe(200);
    expect(bmToggle2.body.data.bookmarked).toBe(false);

    // Delete topic removes it cleanly
    const delTopic = await adminAgent.delete(`/api/topics/${topicId}`);
    expect(delTopic.status).toBe(200);

    // Soft-delete module archives it out of active listing
    const delMod = await adminAgent.delete(`/api/modules/${moduleId}`);
    expect(delMod.status).toBe(200);
    expect(delMod.body.data.isArchived).toBe(true);

    const afterDelMods = await studentAgent.get('/api/modules');
    expect(afterDelMods.body.data).toHaveLength(0);
  });
});
