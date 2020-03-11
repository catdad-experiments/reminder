/* eslint-disable no-console */

export default ({ events, db, dom, notification }) => {
  const arrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = e => reject(e);

      reader.readAsArrayBuffer(file);
    });
  };

  const saveFileShare = async ({ file, createdAt, remindAt }) => {
    const { name: filename, type: filetype } = file;
    const filebuffer = await arrayBuffer(file);

    return await db.save({ filename, filetype, filebuffer, createdAt, remindAt });
  };

  const savePlainShare = async ({ title, text, url, createdAt, remindAt }) => {
    return await db.save({ title, text, url, createdAt, remindAt });
  };

  const fileSplash = ({ file }) => {
    const BODY = dom.children(
      dom.div(),
      dom.img(file),
      dom.children(dom.div('text'), dom.text(`file name: ${file.name}`)),
      dom.children(dom.div('text'), dom.text(`file type: ${file.type}`)),
      dom.children(dom.div('text'), dom.text(`file size: ${file.size}`)),
      dom.children(dom.div('text'), dom.text(''))
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
    const TITLE = field(title || '', 'Title', ['title', 'edit']);
    const TEXT = field(text || '', 'Text', ['text', 'edit']);
    const URL = typeof url === 'string' ? field(url, 'URL', ['text', 'edit']) : null;

    const serializer = () => {
      return {
        title: TITLE ? TITLE.innerText.trim() || null : null,
        text: TEXT ? TEXT.innerText.trim() || null : null,
        url: URL ? URL.innerText.trim() || null : null
      };
    };

    return [serializer, TITLE, TEXT, URL].filter(i => !!i);
  };

  const reminders = () => {
    const now = new Date();
    const tonight = new Date(new Date(now).setHours(21, 0, 0));
    const tomorrowMorning = new Date(new Date(now).setHours(24 + 8, 0, 0));
    const tomorrowEvening = new Date(new Date(now).setHours(24 + 21, 0, 0));

    let result;

    const elems = [
      [now, 'Now'],
      [tonight, 'Tonight'],
      [tomorrowMorning, 'Tomorrow Morning'],
      [tomorrowEvening, 'Tomorrow Evening']
    ].filter(([date]) => date >= now).map(([date, name]) => {
      const elem = dom.button(name, () => {
        deselect();
        elem.classList.add('selected');

        result = date;
      });

      return elem;
    });

    const deselect = () => void elems.forEach(e => e.classList.remove('selected'));

    elems[0].click();

    return [() => result, ...elems];
  };

  const splash = ({ title, text, url, file }) => {
    const [serializer, ...cardFields] = file ? fileSplash({ file }) : plainSplash({ title, text, url });
    const [reminder, ...reminderButtons] = reminders();

    const controls = dom.fragment(
      dom.button('Cancel', () => {
        elem.remove();
      }),
      dom.button('Save', () => {
        const data = serializer();
        data.createdAt = Date.now();
        data.remindAt = reminder().getTime();

        const save = file ? saveFileShare(data) : savePlainShare(data);

        save.then(id => {
          events.emit('render');
          return id;
        }).catch(e => {
          console.error(e);
        }).then(id => {
          elem.remove();

          data.id = id;

          if (reminder() < new Date()) {
            // user wants notification now
            return notification.show(data);
          }

          return notification.schedule(data);
        });
      })
    );

    const elem = dom.children(
      dom.div('splash'),
      dom.children(
        dom.div('limit'),
        dom.children(dom.div('card'), ...cardFields),
        dom.children(
          dom.div('controls'),
          dom.children(dom.div(), dom.p('Remind me:'), ...reminderButtons),
          dom.children(dom.div(), controls)
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
