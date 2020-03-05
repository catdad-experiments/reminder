/* global TimestampTrigger */

const supportsTriggers = typeof Notification !== typeof undefined &&
  typeof TimestampTrigger !== typeof undefined &&
  'showTrigger' in Notification.prototype;

//  registration.showNotification(title, {
//    tag: tag,
//    body: "This notification was scheduled 30 seconds ago",
//    showTrigger: new TimestampTrigger(timestamp + 30 * 1000)
//  });

const notify = async (title, opts, showAsTrigger = false) => {
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

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

export default notify;
