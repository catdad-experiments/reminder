/* eslint-disable no-console */

import toast from './toast.js';
import validate from './init-validate.js';

const TOAST = '🍞';

let events = (function () {
  let collection = [];

  return {
    emit: (...args) => {
      collection.push(args);
    },
    flush: function (emitter) {
      collection.forEach((args) => {
        emitter.emit(...args);
      });
    }
  };
}());

function onError(err, duration = 8 * 1000) {
  // eslint-disable-next-line no-console
  console.error(TOAST, err);

  const html = `${err.prepared ? '' : '<p>An error occured:</p>'}<p>${
    err.message.split('\n').join('<br/>')
  }</p>`;

  toast.error(html, {
    duration
  });
}

window.addEventListener('beforeinstallprompt', () => {
  console.log('👀 we can install the app now');
//  events.emit('can-install', { prompt: ev });
});

window.addEventListener('appinstalled', () => {
//  events.emit('info', '🎊 installed 🎊');
});

if ('serviceWorker' in navigator) {
  console.log('👍', 'navigator.serviceWorker is supported');

  navigator.serviceWorker.register('./service-worker.js', { scope: './' }).then(() => {
    console.log('👍', 'worker registered');
  }).catch(err => {
    console.warn('👎', 'worker errored', err);
  });

  navigator.serviceWorker.addEventListener('message', (ev) => {
    const data = ev.data;

    if (data.action === 'log') {
      return void console.log('worker:', ...data.args);
    }

    if (data.action === 'receive-share') {
      const { title, text, url, file } = data;
      events.emit('receive-share', { title, text, url, file });
      return;
    }

    if (data.action === 'notification-click') {
      events.emit('render-focus', { id: data.id });
      return;
    }

    console.log('worker message', ev.data);
  });
}

export default () => {
  try {
    validate();
  } catch (e) {
    onError(e, -1 /* duration: forever */);
    return;
  }

  function load(name) {
    // get around eslint@5 not supporting dynamic import
    // this is ugly, but I also don't care
    return (new Function(`return import('${name}')`))().then(m => m.default || m);
  }

  async function map(arr, func) {
    const results = [];

    for (let i = 0; i < arr.length; i++) {
      results.push(await func(arr[i], i, arr));
    }

    return results;
  }

  // load all the modules from the server directly
  Promise.all([
    load('./event-emitter.js'),
    load('./db.js'),
    load('./dom.js'),
    load('./receiver.js'),
    load('./renderer.js'),
    load('./create.js'),
  ]).then(async ([
    eventEmitter,
    DB,
    dom,
    ...modules
  ]) => {
    // set up a global event emitter
    const db = await DB();
    const context = { events: eventEmitter(), load, dom, db };
    const destroys = await map(modules, mod => mod(context));

    context.events.on('error', function (err) {
      onError(err, -1);
      destroys.forEach(d => d());
    });

    context.events.on('warn', function (err) {
      onError(err);
    });

    context.events.on('info', (msg) => {
      console.log(TOAST, msg);
      toast.info(msg.toString());
    });

    events.flush(context.events);
    events = context.events;

    events.emit('render');
  }).catch(function catchErr(err) {
    events.emit('error', err);
    onError(err);
  });
};
