/* global TimestampTrigger */

const hasTriggers = typeof Notification !== typeof undefined &&
  typeof TimestampTrigger !== typeof undefined &&
  'showTrigger' in Notification.prototype;

const withRegistration = async (action, withoutRegistration = undefined) => {
  return 'granted' === await Notification.requestPermission() ?
    await action(await navigator.serviceWorker.ready) :
    withoutRegistration;
};

const withTriggers = opts => hasTriggers ? Object.assign({ includeTriggered: true }, opts) : opts;

const create = async (title, opts, showAsTrigger = false) => {
  return await withRegistration(registration => {
    const data = Object.assign({
      icon: 'assets/icon-512.png'
    }, opts);

    if (hasTriggers && showAsTrigger && data.timestamp) {
      data.showTrigger = new TimestampTrigger(data.timestamp);
    } else if (showAsTrigger) {
      return;
    }

    return registration.showNotification(title, data);
  });
};

const get = async () => await withRegistration(async registration => {
  return (await registration.getNotifications(withTriggers({}))).map(n => ({
    id: Number(n.tag),
    delayed: !!n.showTrigger,
    timestamp: n.timestamp
  }));
}, []);

const close = async id => await withRegistration(async registration => {
  for (let n of await registration.getNotifications(withTriggers({ tag: `${id}` }))) {
    n.close();
  }
});

const notifyCard = async ({
  id, remindAt,
  // note properties
  title, text, /* url, */
  // image properties
  filebuffer, filename
}, showAsTrigger = false) => {
  if (filebuffer) {
    const image = URL.createObjectURL(new Blob([filebuffer]));
    await create('', {
      image,
      body: filename,
      tag: `${id}`,
      timestamp: remindAt
    }, showAsTrigger);
    URL.revokeObjectURL(image);
  } else {
    await create(title || 'Reminder', {
      body: text ? `${text}` : undefined,
      tag: `${id}`,
      timestamp: remindAt
    }, showAsTrigger);
  }
};

export const show = async record => await notifyCard(record, false);
export const schedule = async record => hasTriggers ? await notifyCard(record, true) : undefined;
export { get, close, hasTriggers };
