import { mock } from 'node:test';

process.env.DATABASE_URL ??=
  'postgres://techsupply_test:techsupply_test@127.0.0.1:5432/techsupply_test';
process.env.AUTH_SECRET ??= 'techsupply-test-secret';
process.env.PYTHON_API ??= 'http://python-service.test';
process.env.N8N_ENABLED ??= 'false';
process.env.N8N_WEBHOOK_URL ??=
  'http://n8n-service.test/webhook/techsupply-notificaciones';

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
    update: mock.fn(async (changes, options = {}) => {
      options.transaction?.record?.(instance, changes);
      Object.assign(instance, changes);
      return instance;
    }),
    destroy: mock.fn(async (options = {}) => {
      options.transaction?.record?.(instance, {
        destroyed: true,
      });
      instance.destroyed = true;
      return true;
    }),
    toJSON: () => ({ ...instance }),
  };

  return instance;
}

export function stubManagedTransaction(t, sequelize) {
  stubMethods(t, sequelize, {
    transaction: async (callback) => {
      if (typeof callback !== 'function') {
        throw new Error(
          'Las pruebas solo simulan transacciones administradas',
        );
      }

      const snapshots = new Map();
      const transaction = {
        LOCK: {
          UPDATE: 'UPDATE',
        },
        record(target, changes) {
          let snapshot = snapshots.get(target);

          if (!snapshot) {
            snapshot = {};
            snapshots.set(target, snapshot);
          }

          for (const key of Object.keys(changes)) {
            if (!(key in snapshot)) {
              snapshot[key] = target[key];
            }
          }
        },
      };

      try {
        return await callback(transaction);
      } catch (error) {
        for (const [target, snapshot] of snapshots.entries()) {
          for (const [key, value] of Object.entries(snapshot)) {
            if (value === undefined) {
              delete target[key];
            } else {
              target[key] = value;
            }
          }
        }

        throw error;
      }
    },
  });
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
