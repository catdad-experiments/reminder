export default ({ events, db }) => {
  const saveFile = async file => {

  };

  const onShare = async ({ title, text, url, file }) => {
    if (file) {
      await saveFile(file);
      return;
    }

    const result = await db.save({ title, text, url });

    console.log(result);

    events.emit('render');
  };

  events.on('receive-share', onShare);

  return () => {
    events.off('receive-share', onShare);
  };
};
