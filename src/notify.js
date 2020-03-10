/* global TimestampTrigger */

const supportsTriggers = typeof Notification !== typeof undefined &&
  typeof TimestampTrigger !== typeof undefined &&
  'showTrigger' in Notification.prototype;

const getRegistration = async () => {
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    return;
  }

  return await navigator.serviceWorker.ready;
};

const create = async (title, opts, showAsTrigger = false) => {
  const registration = await getRegistration();

  if (!registration) {
    return;
  }

  const data = Object.assign({
    icon: 'assets/icon-512.png'
  }, opts);

  if (supportsTriggers && showAsTrigger && data.timestamp) {
    data.showTrigger = new TimestampTrigger(data.timestamp);
  } else if (showAsTrigger) {
    return;
  }

  return registration.showNotification(title || 'Reminder', data);
};

const notifyCard = async ({
  id, remindAt,
  // note properties
  title, text, /* url, */
  // image properties
  filebuffer, filename
}, showAsTrigger = false) => {
  if (filebuffer) {
    const image = URL.createObjectURL(new Blob([filebuffer]));
    await create(filename, {
      image,
      tag: `${id}`,
      timestamp: remindAt
    }, showAsTrigger);
    URL.revokeObjectURL(image);
  } else {
    await create(title, {
      body: text ? `${text}` : undefined,
      tag: `${id}`,
      timestamp: remindAt
    }, showAsTrigger);
  }
};

export const show = async record => await notifyCard(record, false);
export const schedule = async record => supportsTriggers ? await notifyCard(record, true) : undefined;
export const hasTriggers = supportsTriggers;
