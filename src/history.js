const toFile = (data, { name, type } = {}) => new File([data], name, { type });

// eslint-disable-next-line no-console
const log = (first, ...rest) => console.log(`📖 ${first}`, ...rest);

export default ({ events, db }) => {
  const go = ({ id } = {}) => {
    if (!id) {
      window.history.pushState(null, 'root', '.');
      events.emit('render');

      return;
    }

    db.get({ id }).then(record => {
      window.history.pushState(id, `${id}`, `#${id}`);

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
    });
  };

  const share = ({ title, text, url, file }) => {
    const ev = 'receive-share';

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

    if (id) {
      return void events.emit('history-go', { id });
    }
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
