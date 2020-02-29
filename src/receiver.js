/* eslint-disable no-console */

export default ({ events, db, dom }) => {
  const arrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = e => reject(e);

      reader.readAsArrayBuffer(file);
    });
  };

  const saveFileShare = async ({ file }) => {
    console.log(file.name);
    console.log(file.type);

    const { name: filename, type: filetype } = file;
    const filebuffer = await arrayBuffer(file);

    const result = await db.save({ filename, filetype, filebuffer });
    console.log(result);
  };

  const savePlainShare = async ({ title, text, url }) => {
    const result = await db.save({ title, text, url });
    console.log(result);
  };

  const fileSplash = ({ file }) => {
    const BODY = dom.children(
      dom.div(),
      dom.img(file),
      dom.children(dom.div(), dom.text(`file name: ${file.name}`)),
      dom.children(dom.div(), dom.text(`file type: ${file.type}`)),
      dom.children(dom.div(), dom.text(`file size: ${file.size}`))
    );
    const serializer = () => ({ file });

    return [serializer, BODY];
  };

  const field = (content, title, classnames) => dom.props(
    dom.children(
      dom.classname(dom.div(), ...classnames),
      dom.text(content)
    ), {
      contenteditable: '',
      'data-title': title
    }
  );

  const plainSplash = ({ title, text, url }) => {
    const TITLE = title ? field(title, 'Title...', ['title', 'edit']) : null;
    const TEXT = text ? field(text, 'Text...', ['text', 'edit']) : null;
    const URL = url ? field(url, 'URL...', ['text', 'edit']) : null;

    const serializer = () => {
      return {
        title: TITLE ? TITLE.innerText || null : null,
        text: TEXT ? TEXT.innerText || null : null,
        url: URL ? URL.innerText || null : null
      };
    };

    return [serializer, TITLE, TEXT, URL].filter(i => !!i);
  };

  const splash = ({ title, text, url, file }) => {
    const [serializer, ...elements] = file ? fileSplash({ file }) : plainSplash({ title, text, url });

    const elem = dom.children(
      dom.div('splash'),
      dom.children(
        dom.div('limit'),
        dom.children(dom.div('card'), ...elements),
        dom.children(
          dom.div('controls'),
          dom.button('Cancel', () => {
            elem.remove();
          }),
          dom.button('Save', () => {
            const data = serializer();
            const save = file ? saveFileShare(data) : savePlainShare(data);

            save.then(() => {
              events.emit('render');
            }).catch(e => {
              console.error(e);
            }).then(() => {
              elem.remove();
            });
          })
        )
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
