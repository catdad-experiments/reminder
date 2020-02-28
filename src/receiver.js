/* eslint-disable no-console */

export default ({ events, db, dom }) => {
  const editable = (elem) => dom.props(elem, { contenteditable: '' });

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

    const { name: filename, type: filetype, size: filesize } = file;
    const filebuffer = await arrayBuffer(file);

    const result = await db.save({ filename, filetype, filesize, filebuffer });
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

  const plainSplash = ({ title, text, url }) => {
    const TITLE = editable(dom.children(dom.div('title'), dom.text(title)));
    const TEXT = editable(dom.children(dom.div('text'), dom.text(text)));
    const URL = editable(dom.children(dom.div('url'), dom.text(url)));

    const serializer = () => {
      return {
        title: TITLE.innerText,
        text: TEXT.innerText,
        url: URL.innerText
      };
    };

    return [serializer, TITLE, TEXT, URL];
  };

  const splash = ({ title, text, url, file }) => {
    const [serializer, ...elements] = file ? fileSplash({ file }) : plainSplash({ title, text, url });

    const elem = dom.children(
      dom.classname(dom.div(), 'splash', 'limit'),
      ...elements,
      dom.children(
        dom.div(),
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
