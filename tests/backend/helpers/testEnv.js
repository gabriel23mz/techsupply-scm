import { mock } from 'node:test';

process.env.DATABASE_URL ??=
  'postgres://techsupply_test:techsupply_test@127.0.0.1:5432/techsupply_test';
process.env.AUTH_SECRET ??= 'techsupply-test-secret';
process.env.PYTHON_API ??= 'http://python-service.test';

export function stubMethods(t, target, methods) {
  const originals = new Map();

  for (const [name, implementation] of Object.entries(methods)) {
    originals.set(name, target[name]);
    target[name] = mock.fn(implementation);
  }

  t.after(() => {
    for (const [name, original] of originals.entries()) {
      target[name] = original;
    }
  });
}

export function modelInstance(fields = {}) {
  const instance = {
    ...fields,
    update: mock.fn(async (changes) => {
      Object.assign(instance, changes);
      return instance;
    }),
    destroy: mock.fn(async () => true),
    toJSON: () => ({ ...instance }),
  };

  return instance;
}

export function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}
