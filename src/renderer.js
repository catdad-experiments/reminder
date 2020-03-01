const notify = async (title, opts) => {
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  return registration.showNotification(title, opts);
};

const dateString = date => {
  const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const hour = `${date.getHours() % 12 || 12} ${date.getHours() < 12 ? 'am' : 'pm'}`;
  return `${day}, ${date.toLocaleDateString()}, ${hour}`;
};

export default ({ events, db, dom }) => {
  const elem = document.querySelector('#main');
  let FOCUS_ID;

  const renderDate = remindAt => remindAt ?
    dom.classname(dom.span(dateString(new Date(remindAt))), 'date') :
    dom.nill();

  const renderFile = (card, { id, filebuffer, filename, filetype, remindAt }) => {
    dom.children(
      card,
      dom.img(new Blob([filebuffer])),
      dom.children(
        dom.div('text'),
        dom.text(`${filename} (${filetype})`)
      ),
      dom.children(
        dom.div('buttons'),
        renderDate(remindAt),
        dom.click(dom.icon('notifications_active'), async () => {
          const image = URL.createObjectURL(new Blob([filebuffer]));
          await notify(filename, {
            image,
            tag: `${id}`,
            timestamp: remindAt
          });
          URL.revokeObjectURL(image);
        })
      )
    );
  };

  const renderField = field => {
    if (!field) {
      return dom.nill();
    }

    return dom.fragment(
      ...field.split('\n').map(i => i.trim()).map(line => {
        const urls = line.match(/[a-z]+:\/\/[^ ]+/ig);

        if (!urls) {
          return dom.p(line);
        }

        const lineElements = [];
        let tempLine = line;

        for (let url of urls) {
          const [before, ...rest] = tempLine.split(url);

          lineElements.push(dom.span(before));
          lineElements.push(dom.link(url, url));
          tempLine = rest.join(url);
        }

        if (tempLine) {
          lineElements.push(dom.span(tempLine));
        }

        return dom.children(
          dom.p(),
          dom.fragment(...lineElements)
        );
      })
    );
  };

  const renderPlain = (card, { id, title, text, url, remindAt }) => {
    dom.children(
      card,
      title ? dom.children(dom.div('title'), renderField(title)) : dom.nill(),
      text ? dom.children(dom.div('text'), renderField(text)) : dom.nill(),
      url ? dom.children(dom.div('text'), renderField(url)) : dom.nill(),
      dom.children(
        dom.div('buttons'),
        renderDate(remindAt),
        dom.click(dom.icon('notifications_active'), async (e) => {
          e.stopPropagation();

          await notify(title, {
            body: `${text}`,
            tag: `${id}`,
            timestamp: remindAt
          });
        }),
        navigator.share ? dom.click(dom.icon('share'), async (e) => {
          e.stopPropagation();

          const data = {};
          title && (data.title = title);
          text && (data.text = text);
          url && (data.url = url);

          try {
            await navigator.share(data);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('share error:', e);
          }
        }) : dom.nill()
      )
    );
  };

  const getCards = () => [].slice.call(document.querySelectorAll('.card'))
    .map(card => {
      return {
        card, id: Number(card.getAttribute('data-id'))
      };
    });

  const applyCardFocus = () => {
    getCards().forEach(({ card, id }) => {
      if (id !== FOCUS_ID) {
        return void card.classList.remove('focused');
      }

      card.classList.add('focused');
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const onRender = async () => {
    const cards = getCards();

    let currentCard;

    await db.each(null, record => {
      const idx = cards.findIndex(c => c.id === record.id);

      if (idx !== -1) {
        currentCard = cards[idx];
        return;
      }

      const card = dom.props(dom.div('card'), {
        'data-id': record.id
      });

      if (record.filebuffer) {
        renderFile(card, record);
      } else {
        renderPlain(card, record);
      }

      dom.children(card, dom.div('focus-inset'));

      if (currentCard) {
        elem.insertBefore(card, currentCard.card);
      } else {
        elem.insertBefore(card, elem.firstChild);
      }
    });

    applyCardFocus();
  };

  const onRenderFocus = ({ id }) => {
    FOCUS_ID = id;
    applyCardFocus();
  };

  events.on('render', onRender);
  events.on('render-focus', onRenderFocus);

  return () => {
    events.off('render', onRender);
    events.off('render-focus', onRenderFocus);
  };
};
