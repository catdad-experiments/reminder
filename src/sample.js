const samples = {
  simple: {
    title: 'Check out this cool app! 🔔',
    text: 'https://github.com/catdad-experiments/reminder',
    url: null
  }
};

export default ({ events }) => {
  const query = window.location.search.substring(1).split('&').reduce((memo, item) => {
    const [key, ...value] = item.split('=');
    memo[key] = value.join('=');

    return memo;
  }, {});

  const timer = setTimeout(() => {
    if (query.sample && samples[query.sample]) {
      events.emit('receive-share', samples[query.sample]);
    }
  }, 0);

  return () => {
    clearTimeout(timer);
  };
};
