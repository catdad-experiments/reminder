const notify = async (title, opts) => {
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  return registration.showNotification(title, opts);
};

export default ({ events, db, dom }) => {
  const elem = document.querySelector('#main');
  let FOCUS_ID;

  const renderFile = (card, { filebuffer, filename, filetype, dateTime }) => {
    dom.children(
      card,
      dom.img(new Blob([filebuffer])),
      dom.children(
        dom.div('text'),
        dom.text(`${filename} (${filetype})`)
      ),
      dom.children(dom.div('buttons'), dom.click(dom.icon('notifications_active'), async () => {
        const image = URL.createObjectURL(new Blob([filebuffer]));
        await notify(filename, {
          image,
          timestamp: dateTime
        });
        URL.revokeObjectURL(image);
      }))
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

  const renderPlain = (card, { id, title, text, url, dateTime }) => {
    dom.children(
      card,
      title ? dom.children(dom.div('title'), renderField(title)) : dom.nill(),
      text ? dom.children(dom.div('text'), renderField(text)) : dom.nill(),
      url ? dom.children(dom.div('text'), renderField(url)) : dom.nill(),
      dom.children(
        dom.div('buttons'),
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
        }) : dom.nill(),
        dom.click(dom.icon('notifications_active'), async (e) => {
          e.stopPropagation();

          await notify(title, {
            body: `${text}`,
            tag: `${id}`,
            timestamp: dateTime
          });
        })
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
