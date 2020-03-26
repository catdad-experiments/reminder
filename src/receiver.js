import { html, render } from './preact.js';

const arrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = e => reject(e);

    reader.readAsArrayBuffer(file);
  });
};

const fileSplash = ({ file }) => {
  const url = URL.createObjectURL(file);

  const BODY = html`<div>
    <img src=${url} onload=${() => void URL.revokeObjectURL(url)} />
    <div class=text>file name: ${file.name}</div>
    <div class=text>file type: ${file.type}</div>
    <div class=text>file size: ${file.size}</div>
    <div class=text></div>
  </div>`;

  const serializer = () => ({ file });

  return [serializer, BODY];
};

const plainSplash = ({ title, text, url }) => {
  const field = (content, title, type, change) =>
    html`<div class="edit ${type}" data-title=${title} oninput=${change} contenteditable>${content}</div>`;

  const TITLE = field(title || '', 'Title', 'title', (e) => {
    title = e.target.innerText.trim();
  });
  const TEXT = field(text || '', 'Text', 'text', (e) => {
    text = e.target.innerText.trim();
  });
  const URL = typeof url === 'string' ? field(url, 'URL', 'text', (e) => {
    url = e.target.innerText.trim();
  }) : null;

  const serializer = () => ({ title, text, url });

  return [serializer, TITLE, TEXT, URL].filter(i => !!i);
};

const reminders = (hasTriggers) => {
  const now = new Date();
  const tonight = new Date(new Date(now).setHours(21, 0, 0));
  const tomorrowMorning = new Date(new Date(now).setHours(24 + 8, 0, 0));
  const tomorrowEvening = new Date(new Date(now).setHours(24 + 21, 0, 0));

  let result;
  const refs = [];

  const deselect = () => refs.forEach(r => r.current.classList.remove('selected'));

  const elems = [
    [hasTriggers ? tonight : 0, 'Tonight'],
    [hasTriggers ? tomorrowMorning : 0, 'Tomorrow Morning'],
    [hasTriggers ? tomorrowEvening : 0, 'Tomorrow Evening'],
    [now, 'Now']
  ].filter(([date]) => date >= now).map(([date, name], idx) => {
    const ref = {};
    const classname = idx === 0 ? 'selected' : '';

    if (idx === 0) {
      result = date;
    }

    refs.push(ref);

    return html`<button class=${classname} ref=${ref} onclick=${() => {
      deselect();
      ref.current.classList.add('selected');

      result = date;
    }}>${name}</button>`;
  });

  return [() => result, ...elems];
};

export default ({ events, db, notification }) => {
  const saveFileShare = async ({ file, ...rest }) => {
    const { name: filename, type: filetype } = file;
    const filebuffer = await arrayBuffer(file);

    return await db.save({ filename, filetype, filebuffer, ...rest });
  };

  const savePlainShare = async ({ title, text, url, ...rest }) => {
    return await db.save({ title, text, url, ...rest });
  };

  const splash = ({ title, text, url, file, id }) => {
    const [serializer, ...cardFields] = file ? fileSplash({ file }) : plainSplash({ title, text, url });
    const [reminder, ...reminderButtons] = reminders(notification.hasTriggers);

    const elem = document.createElement('div');
    elem.classList.add('splash');

    const stuff = html`<div class=limit>
      <div class=card>${cardFields}</div>
      <div class=controls>
        <div><p>Remind me:</p></div>
        <div>${reminderButtons}</div>
        <button onclick=${() => {
          elem.remove();
          events.emit('history-go');
        }}>Cancel</button>
        <button onclick=${() => {
          const data = serializer();
          data.createdAt = Date.now();
          data.remindAt = reminder().getTime();

          if (id !== undefined) {
            data.id = id;
          }

          const save = file ? saveFileShare(data) : savePlainShare(data);

          save.then(async id => {
            const record = await db.get({ id });

            if (reminder() < new Date()) {
              // user wants notification now
              return await notification.show(record);
            }

            await notification.schedule(record);
          }).catch(e => {
            // eslint-disable-next-line no-console
            console.error(e);
          }).then(() => {
            elem.remove();
            events.emit('history-go');
          });
        }}>Save</button>
      </div>
    </div>`;

    render(stuff, elem);

    document.body.appendChild(elem);
  };

  const onShare = async ({ title, text, url, file, id }) => {
    splash({ title, text, url, file, id });
  };

  events.on('receive-share', onShare);

  return () => {
    events.off('receive-share', onShare);
  };
};
