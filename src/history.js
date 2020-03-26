const toFile = (data, { name, type } = {}) => new File([data], name, { type });

// eslint-disable-next-line no-console
const log = (first, ...rest) => console.log(`📖 ${first}`, ...rest);

export default ({ events, db }) => {
  const go = ({ id, push = true, replace = false } = {}) => {
    if (id) {
      log('go!', id);

      return void db.get({ id }).then(record => {
        if (push) {
          window.history.pushState(id, `${id}`, `#${id}`);
        }

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

    if (replace) {
      log('replace with root');
      window.history.replaceState(null, 'root', '.');
    } else {
      log('go to root');
      window.history.pushState(null, 'root', '.');
    }

    events.emit('render');
  };

  const share = ({ title, text, url, file }) => {
    const ev = 'receive-share';

    window.history.pushState('new', 'new', '#new');

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

  const popState = (ev) => {
    const { state: id } = ev;

    log('pop:', id);

    if (id && id !== 'new') {
      return void go({ id, push: false });
    }

    return void go({ replace: true });
  };

  events.on('history-go', go);
  events.on('history-share', share);

  window.addEventListener('popstate', popState);

  return () => {
    events.off('history-go', go);
    events.off('history-share', share);

    window.removeEventListener('popstate', popState);
  };
};
