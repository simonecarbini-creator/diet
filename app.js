async function loadDiet() {
  const container = document.getElementById('diet');
  try {
    const response = await fetch('diet-data.json', { cache: 'no-store' });
    const diet = await response.json();
    renderDiet(diet);
  } catch (error) {
    container.textContent = 'Impossibile caricare la dieta.';
  }
}

function renderDiet(diet) {
  document.getElementById('meta').textContent =
    `Settimana: ${diet.settimana} · Aggiornata il ${diet.aggiornata}`;

  const container = document.getElementById('diet');
  container.innerHTML = '';

  diet.giorni.forEach((giorno) => {
    const section = document.createElement('section');
    const title = document.createElement('h2');
    title.textContent = giorno.giorno;
    section.appendChild(title);

    giorno.pasti.forEach((pasto) => {
      const mealTitle = document.createElement('h3');
      mealTitle.textContent = pasto.nome;
      const list = document.createElement('ul');
      pasto.alimenti.forEach((alimento) => {
        const item = document.createElement('li');
        item.textContent = alimento;
        list.appendChild(item);
      });
      section.append(mealTitle, list);
    });

    container.appendChild(section);
  });
}

loadDiet();
