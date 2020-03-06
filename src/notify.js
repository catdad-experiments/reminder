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

const notify = async (title, opts, showAsTrigger = false) => {
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
    await notify(filename, {
      image,
      tag: `${id}`,
      timestamp: remindAt
    }, showAsTrigger);
    URL.revokeObjectURL(image);
  } else {
    await notify(title, {
      body: text ? `${text}` : undefined,
      tag: `${id}`,
      timestamp: remindAt
    }, showAsTrigger);
  }
};

export default notifyCard;
