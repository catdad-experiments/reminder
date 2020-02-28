const samples = {
  simple: {
    title: 'Check out this cool app! 🔔',
    text: 'https://github.com/catdad-experiments/reminder',
    url: null
  }
};

export default ({ events, dom }) => {
  const query = window.location.search.substring(1).split('&').reduce((memo, item) => {
    const [key, ...value] = item.split('=');
    memo[key] = value.join('=');

    return memo;
  }, {});

  const sampleFileShare = () => {
    const input = dom.props(dom.elem('input'), { type: 'file' });
    const splash = dom.children(
      dom.classname(dom.div(), 'splash', 'limit'),
      dom.children(dom.div(), dom.text('Select a file to show sample share')),
      input
    );

    document.body.appendChild(splash);

    input.onchange = (ev) => {
      const file = ev.target.files[0];

      splash.remove();

      if (file) {
        events.emit('receive-share', { file });
      }
    };
  };

  const timer = setTimeout(() => {
    if (query.sample === 'file') {
      return sampleFileShare();
    }

    if (query.sample && samples[query.sample]) {
      events.emit('receive-share', samples[query.sample]);
    }
  }, 0);

  return () => {
    clearTimeout(timer);
  };
};
