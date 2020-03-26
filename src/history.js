const toFile = (data, { name, type } = {}) => new File([data], name, { type });

// eslint-disable-next-line no-console
const log = (first, ...rest) => console.log(`📖 ${first}`, ...rest);

export default ({ events, db }) => {
  const state = (action, value, title, url) => {
    if (action === 'push') {
      log('push state', value, title, url);
      window.history.pushState(value, title, url);
    }

    if (action === 'replace') {
      log('replace state', value, title, url);
      window.history.replaceState(value, title, url);
    }
  };

  const go = ({ id, action = 'push' } = {}) => {
    if (id) {
      log('go!', id);

      return void db.get({ id }).then(record => {
        state(action, id, `${id}`, `#${id}`);

        const item = record.filebuffer ? {
          id: record.id,
          file: toFile(record.filebuffer, {
            name: record.filename,
            type: record.filetype
          })
        } : Object.assign({}, record);

        events.emit('receive-share', item);
      }).catch(err => {
        events.emit('warn', err);
        go({ replace: true });
      });
    }

    state(action, null, 'root', '.');
    events.emit('render');
  };

  const share = ({ title, text, url, file }, action = 'push') => {
    const ev = 'receive-share';

    state(action, 'new', 'new', '#new');

    if (file) {
      events.emit(ev, { file });
    } else {
      events.emit(ev, [
        [title, 'title'],
        [text, 'text'],
        [url, 'url'],
      ].filter(([val]) => !!val).reduce((memo, [value, name]) => {
        memo[name] = value;
      }, {}));
    }
  };

  const ready = () => {
    log('ready');

    const hashVal = window.location.hash.replace(/^#/, '');
    const hashId = parseInt(hashVal, 10);

    if (hashVal === 'new') {
      share({ title: '', text: '' }, null);
    } else if (isNaN(hashId)) {
      events.emit('render');
    } else {
      go({ id: hashId, action: 'replace' });
    }
  };

  const popState = (ev) => {
    const { state: id } = ev;

    log('pop:', id);

    if (id && id !== 'new') {
      return void go({ id, action: null });
    }

    return void go({ action: 'replace' });
  };

  events.on('history-go', go);
  events.on('history-share', share);
  events.once('ready', ready);

  window.addEventListener('popstate', popState);

  return () => {
    events.off('history-go', go);
    events.off('history-share', share);
    events.off('ready', ready);

    window.removeEventListener('popstate', popState);
  };
};
