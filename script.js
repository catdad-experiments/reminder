/* jshint esversion: 6, browser: true, devel: true */

const divResult = document.getElementById('result');
const divInstall = document.getElementById('installContainer');
const butInstall = document.getElementById('butInstall');
const butShare = document.getElementById('butShare');

window.addEventListener('beforeinstallprompt', (event) => {
  console.log('👍', 'beforeinstallprompt', event);
  // Stash the event so it can be triggered later.
  window.deferredPrompt = event;
  // Remove the 'hidden' class from the install button container
  butInstall.removeAttribute('disabled');
});

butInstall.addEventListener('click', () => {
  console.log('👍', 'install clicked');

  const promptEvent = window.deferredPrompt;
  if (!promptEvent) {
    // The deferred prompt isn't available.
    return;
  }

  // Show the install prompt.
  promptEvent.prompt();
  // Log the result
  promptEvent.userChoice.then((result) => {
    console.log('👍', 'userChoice', result);
    // Reset the deferred prompt variable, since
    // prompt() can only be called once.
    window.deferredPrompt = null;
    // Hide the install button.
    butInstall.setAttribute('disabled', true);
  });
});

window.addEventListener('appinstalled', (event) => {
  console.log('👍', 'appinstalled', event);
});

if ('share' in navigator) {
  console.log('👍', 'navigator.share is supported');

  butShare.removeAttribute('disabled');

  butShare.addEventListener('click', (e) => {
    console.log('👍', 'butShare-clicked', e);

    e.preventDefault();
    const shareOpts = {
      title: 'Jabberwocky',
      text: 'Check out this great poem about a Jabberwocky.',
      url: 'https://en.wikipedia.org/wiki/Jabberwocky',
    };

    navigator.share(shareOpts)
        .then((e) => {
          const msg = 'navigator.share succeeded.';
          divResult.textContent = msg;
          console.log('👍', msg, e);
        })
        .catch((err) => {
          const msg = 'navigator.share failed';
          divResult.textContent = `${msg}\n${JSON.stringify(err)}`;
          console.error('👎', msg, err);
        });
  });
} else  {
  console.warn('👎', 'navigator.share is not supported');

  const divNotSup = document.getElementById('shareNotSupported');
  divNotSup.classList.toggle('hidden', false);
}

/* Only register a service worker if it's supported */
if ('serviceWorker' in navigator) {
  console.log('👍', 'navigator.serviceWorker is supported');

  navigator.serviceWorker.register('/service-worker.js').then((registration) => {
    console.log('👍', 'worker registered');

    registration.sync.register('reminder').then(() => {
      console.log('👍', 'sync registration succeeded');
    }).catch(err => {
      console.warn('👎', 'sync registration errored', err);
    });

  }).catch(err => {
    console.warn('👎', 'worker errored', err);
  });
}
