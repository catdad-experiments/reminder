/* eslint-disable no-console */

export default ({ events, db, dom }) => {
  const editable = (elem) => dom.props(elem, { contenteditable: '' });

  const savePlainShare = async ({ title, text, url }) => {
    const result = await db.save({ title, text, url });
    console.log(result);
  };

  const saveFileShare = async ({ file }) => {

  };

  const splash = ({ title, text, url, file }) => {
    const TITLE = editable(dom.children(dom.div('title'), dom.text(title)));
    const TEXT = editable(dom.children(dom.div('text'), dom.text(text)));
    const URL = editable(dom.children(dom.div('url'), dom.text(url)));

    const elem = dom.children(
      dom.div('splash'),
      TITLE, TEXT, URL,
      dom.children(
        dom.div(),
        dom.button('Cancel', () => {
          elem.remove();
        }),
        dom.button('Save', () => {
          const title = TITLE.innerText;
          const text = TEXT.innerText;
          const url = URL.innerText;

          savePlainShare({ title, text, url }).then(() => {
            events.emit('render');
          }).catch(e => {
            console.error(e);
          }).then(() => {
            elem.remove();
          });
        })
      )
    );

    document.body.appendChild(elem);
  };

  const onShare = async ({ title, text, url, file }) => {
    splash({ title, text, url, file });
  };

  events.on('receive-share', onShare);

  return () => {
    events.off('receive-share', onShare);
  };
};
