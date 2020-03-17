/* eslint-disable indent, no-console */

import { html, render } from './preact.js';

const arrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = e => reject(e);

    reader.readAsArrayBuffer(file);
  });
};

export default ({ events, db, notification }) => {
  const saveFileShare = async ({ file, createdAt, remindAt }) => {
    const { name: filename, type: filetype } = file;
    const filebuffer = await arrayBuffer(file);

    return await db.save({ filename, filetype, filebuffer, createdAt, remindAt });
  };

  const savePlainShare = async ({ title, text, url, createdAt, remindAt }) => {
    return await db.save({ title, text, url, createdAt, remindAt });
  };

  const fileSplash = ({ file }) => {
    const url = URL.createObjectURL(file);

    const BODY = html`<div>
      <img src=${url} onload=${() => {
        URL.revokeObjectURL(url);
      }} />
      <div class=text>file name: ${file.name}</div>
      <div class=text>file type: ${file.type}</div>
      <div class=text>file size: ${file.size}</div>
      <div class=text></div>
    </div>`;

    const serializer = () => ({ file });

    return [serializer, BODY];
  };

  const plainSplash = ({ title, text, url }) => {
    const TITLE = html`<div class="title edit" contenteditable oninput=${(e) => {
      title = e.target.innerText.trim();
    }} data-title=Title>${title || ''}</div>`;
    const TEXT = html`<div class="text edit" contenteditable oninput=${(e) => {
      text = e.target.innerText.trim();
    }} data-title=Text>${text || ''}</div>`;
    const URL = typeof url === 'string' ? html`<div class="text edit" contenteditable oninput=${(e) => {
      url = e.target.innerText.trim();
    }} data-title=URL>${url}</div>` : null;

    const serializer = () => ({ title, text, url });

    return [serializer, TITLE, TEXT, URL].filter(i => !!i);
  };

  const reminders = () => {
    const now = new Date();
    const tonight = new Date(new Date(now).setHours(21, 0, 0));
    const tomorrowMorning = new Date(new Date(now).setHours(24 + 8, 0, 0));
    const tomorrowEvening = new Date(new Date(now).setHours(24 + 21, 0, 0));

    let result;
    const refs = [];

    const deselect = () => refs.forEach(r => r.current.classList.remove('selected'));

    const elems = [
      [tonight, 'Tonight'],
      [tomorrowMorning, 'Tomorrow Morning'],
      [tomorrowEvening, 'Tomorrow Evening'],
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

  const splash = ({ title, text, url, file }) => {
    const [serializer, ...cardFields] = file ? fileSplash({ file }) : plainSplash({ title, text, url });
    const [reminder, ...reminderButtons] = reminders();

    const elem = document.createElement('div');
    elem.classList.add('splash');

    const stuff = html`<div class=limit>
      <div class=card>${cardFields}</div>
      <div class=controls>
        <div><p>Remind me:</p></div>
        <div>${reminderButtons}</div>
        <button onclick=${() => {
          elem.remove();
        }}>Cancel</button>
        <button onclick=${() => {
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
        }}>Save</button>
      </div>
    </div>`;

    render(stuff, elem);

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
