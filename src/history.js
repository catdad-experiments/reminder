const toFile = (data, { name, type } = {}) => new File([data], name, { type });

export default ({ events, db }) => {
  const go = ({ id }) => {
    db.get({ id }).then(record => {
      const item = record.filebuffer ? {
        id: record.id,
        file: toFile(record.filebuffer, {
          name: record.filename,
          type: record.filetype,
          size: record.filebuffer.length
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

  events.on('history-go', go);
  events.on('history-share', share);

  return () => {
    events.off('history-go', go);
    events.off('history-share', share);
  };
};
