import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@2.0.4/dist/dexie.es.js';

const DB_NAME = 'reminder-v1';
const TABLE = 'data';

const once = (() => {
  const results = new Map();

  return func => async (...args) => {
    if (results.has(func)) {
      return results.get(func);
    }

    const result = await func(...args);
    results.set(func, result);

    return result;
  };
})();

const init = once(async () => {
  const SCHEMA_V1 = {};
  SCHEMA_V1[TABLE] = '++id';

  const db = new Dexie(DB_NAME);
  db.version(1).stores(SCHEMA_V1);

  const save = async data => {
    // put is an upsert operation
    return await db[TABLE].put(data);
  };

  const removeAll = async () => {
    // Dexie always needs a query. Since 'group' will never equal *,
    // that query will match all records
    await db[TABLE].where('group').notEqual('*').delete();
  };

  const remove = async query => {
    await db[TABLE].where(query).delete();
  };

  const getAll = async query => {
    return await db[TABLE].where(query).toArray();
  };

  const get = async query => {
    return await db[TABLE].where(query).first();
  };

  const each = async (query, func) => {
    await (query ? db[TABLE].where(query) : db[TABLE]).each(record => {
      func(record);
    });
  };

  return {
    save, removeAll, remove, getAll, get, each
  };
});

export default init;
