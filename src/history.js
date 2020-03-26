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

  events.on('history-go', go);

  return () => {
    events.off('history-go', go);
  };
};
