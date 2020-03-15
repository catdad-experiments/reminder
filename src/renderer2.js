/* eslint-disable indent, no-console */

import { html, render, Fragment } from './preact.js';

const noErr = prom => prom.catch(e => {
  // eslint-disable-next-line no-console
  console.error('Hanlded Error:', e);
});

const dateString = date => {
  const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const hour = `${date.getHours() % 12 || 12} ${date.getHours() < 12 ? 'am' : 'pm'}`;
  return `${day}, ${date.toLocaleDateString()}, ${hour}`;
};

const ImageCard = record => {
  const url = URL.createObjectURL(new Blob([record.filebuffer]));

  return html`
    <${Fragment} key=fragment${record.id}>
      <img key=img${record.id} src=${url} onload=${() => {
        console.log('revoke url', record.id);
        URL.revokeObjectURL(url);
      }} />
      <div class=text>
        ${record.filename} (${record.filetype})
      </div>
    <//>
  `;
};

const Field = ({ value, ...rest }) => {
  if (!value) {
    return html``;
  }

  return html`<div ...${rest}>
    ${value.split('\n').map(i => i.trim()).map(line => {
      const urls = line.match(/[a-z]+:\/\/[^ ]+/ig);

      if (!urls) {
        return html`<p>${line}</p>`;
      }

      const lineElements = [];
      let tempLine = line;

      for (let url of urls) {
        const [before, ...rest] = tempLine.split(url);

        lineElements.push(html`<span>${before}</span>`);
        lineElements.push(html`<a href=${url}>${url}</a>`);
        tempLine = rest.join(url);
      }

      if (tempLine) {
        lineElements.push(html`<span>${tempLine}</span>`);
      }

      return html`<p>${lineElements}</p>`;
    })}
  </div>`;
};

const NoteCard = record => {
  const { title, text, url } = record;

  return html`
    <${Fragment}>
      <${Field} class=title value=${title} />
      <${Field} class=text value=${text} />
      <${Field} class=text value=${url} />
    <//>
  `;
};

const Card = record => {
  return html`
    <${Fragment}>
      <${record.filebuffer ? ImageCard : NoteCard} ...${record} />
    <//>
  `;
};

const ReminderDate = ({ remindAt }) => {
  return html`<span class=date>${remindAt ? dateString(new Date(remindAt)) : 'Never'}</span>`;
};

const Icon = ({ name, ...rest }) => {
  return html`<i class=material-icons ...${rest}>${name}</i>`;
};

export default ({ events, db, notification }) => {
  const elem = document.querySelector('#main');
  let FOCUS_ID;

  const onRender = async () => {
    console.time('preact render');

    const notifications = (await notification.get()).reduce((m, n) => {
      m[n.id] = n;
      return m;
    }, {});

    console.log(notifications);

    const children = [];

    await db.each(null, record => {
      const isFile = 'filebuffer' in record;

      children.push(html`
        <div key=${record.id} class=${['card'].concat(record.id === FOCUS_ID ? ['focused'] : []).join(' ')} data-id=${record.id}>
          <${Card} ...${record} />
          <div class=buttons>
            <${ReminderDate} remindAt=${record.remindAt} />
            <${Icon} name=notifications_active onClick=${async (e) => {
              e.stopPropagation();
              await noErr(notification.show(record));
            }}/>
            ${isFile ? null : html`<${Icon} name=share onClick=${async (e) => {
              e.stopPropagation();

              const data = {};
              record.title && (data.title = record.title);
              record.text && (data.text = record.text);
              record.url && (data.url = record.url);

              await noErr(navigator.share(data));
            }}/>`}
            <${Icon} name=delete onClick=${async (e) => {
              e.stopPropagation();
              await noErr(db.remove({ id: record.id }));
              await noErr(onRender());
            }}/>
          </div>
          <div class=focus-inset></div>
        </div>
      `);
    });

    console.time('preact');
    render(html`<${Fragment}>${children.reverse()}<//>`, elem);
    console.timeEnd('preact');

    console.timeEnd('preact render');

    events.emit('render-complete');
  };

  const onRenderFocus = ({ id }) => {
    FOCUS_ID = id;
    onRender();
  };

  events.on('render', onRender);
  events.on('render-focus', onRenderFocus);

  return () => {
    events.off('render', onRender);
    events.off('render-focus', onRenderFocus);
  };
};
