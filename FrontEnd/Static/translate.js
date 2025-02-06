lucide.createIcons();

// DOM Elements
const fromText = document.getElementById('fromText');
const toText = document.getElementById('toText');
const fromLang = document.getElementById('fromLang');
const toLang = document.getElementById('toLang');
const translateBtn = document.getElementById('translateBtn');
const swapBtn = document.getElementById('swapLangs');
const fromSpeak = document.getElementById('fromSpeak');
const toSpeak = document.getElementById('toSpeak');
const fromCopy = document.getElementById('fromCopy');
const toCopy = document.getElementById('toCopy');
const fromCopyIcon = document.getElementById('fromCopyIcon');
const toCopyIcon = document.getElementById('toCopyIcon');
const fromMic = document.getElementById('fromMic');
const favoriteBtn = document.getElementById('favoriteBtn');
const favoriteIcon = document.getElementById('favoriteIcon');
const fromCount = document.getElementById('fromCount');
const downloadBtn = document.getElementById('downloadBtn');
const historyBtn = document.getElementById('historyBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
// DOM Elements (continued)
const historySidebar = document.getElementById('historySidebar');
const favoritesSidebar = document.getElementById('favoritesSidebar');
const historyContent = document.getElementById('historyContent');
const favoritesContent = document.getElementById('favoritesContent');
const closeHistory = document.getElementById('closeHistory');
const closeFavorites = document.getElementById('closeFavorites');

// State Management
let isListening = false;
const history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
const favorites = JSON.parse(localStorage.getItem('translationFavorites') || '[]');

// Character count update
fromText.addEventListener('input', () => {
  fromCount.textContent = `${fromText.value.length}/5000`;
});

// Translation function
async function translate() {
  if (!fromText.value) return;

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        fromText.value
      )}&langpair=${fromLang.value}|${toLang.value}`
    );
    const data = await response.json();
    toText.value = data.responseData.translatedText;

    // Add to history
    addToHistory({
      from: fromText.value,
      to: toText.value,
      fromLang: fromLang.value,
      toLang: toLang.value,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Translation error:', error);
    toText.value = 'Translation error. Please try again.';
  }
}

// Speech recognition
if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  
  fromMic.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      fromMic.style.color = '';
      isListening = false;
    } else {
      recognition.start();
      fromMic.style.color = '#EF4444';
      isListening = true;
    }
  });

  recognition.onresult = (event) => {
    fromText.value = event.results[0][0].transcript;
    fromCount.textContent = `${fromText.value.length}/5000`;
    translate();
  };

  recognition.onend = () => {
    fromMic.style.color = '';
    isListening = false;
  };
}

// History management
function addToHistory(item) {
  history.unshift(item);
  if (history.length > 20) history.pop();
  localStorage.setItem('translationHistory', JSON.stringify(history));
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  historyContent.innerHTML = history.map(item => `
    <div class="history-item" onclick="loadTranslation(this)">
      <div class="item-langs">
        <span>${item.fromLang} → ${item.toLang}</span>
        <span>${new Date(item.timestamp).toLocaleString()}</span>
      </div>
      <div class="item-text">${item.from}</div>
      <div class="item-translation">${item.to}</div>
    </div>
  `).join('');
}

// Favorites management
function toggleFavorite() {
  const currentTranslation = {
    from: fromText.value,
    to: toText.value,
    fromLang: fromLang.value,
    toLang: toLang.value,
    timestamp: new Date().toISOString()
  };

  const index = favorites.findIndex(f => 
    f.from === currentTranslation.from && 
    f.to === currentTranslation.to
  );

  if (index === -1) {
    favorites.unshift(currentTranslation);
    favoriteIcon.style.color = '#FCD34D';
    favoriteIcon.style.fill = '#FCD34D';
  } else {
    favorites.splice(index, 1);
    favoriteIcon.style.color = '';
    favoriteIcon.style.fill = 'none';
  }

  localStorage.setItem('translationFavorites', JSON.stringify(favorites));
  updateFavoritesDisplay();
}

function updateFavoritesDisplay() {
  favoritesContent.innerHTML = favorites.map(item => `
    <div class="favorite-item" onclick="loadTranslation(this)">
      <div class="item-langs">
        <span>${item.fromLang} → ${item.toLang}</span>
        <span>${new Date(item.timestamp).toLocaleString()}</span>
      </div>
      <div class="item-text">${item.from}</div>
      <div class="item-translation">${item.to}</div>
    </div>
  `).join('');
}

// Load translation from history/favorites
function loadTranslation(element) {
  const item = {
    from: element.querySelector('.item-text').textContent,
    to: element.querySelector('.item-translation').textContent,
    fromLang: element.querySelector('.item-langs span').textContent.split(' → ')[0],
    toLang: element.querySelector('.item-langs span').textContent.split(' → ')[1]
  };

  fromText.value = item.from;
  toText.value = item.to;
  fromLang.value = item.fromLang;
  toLang.value = item.toLang;
  fromCount.textContent = `${item.from.length}/5000`;
}

// Download translation
function downloadTranslation() {
  if (!fromText.value || !toText.value) return;

  const content = `Source (${fromLang.value}):
${fromText.value}

Translation (${toLang.value}):
${toText.value}`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'translation.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event Listeners
translateBtn.addEventListener('click', translate);
swapBtn.addEventListener('click', () => {
  [fromLang.value, toLang.value] = [toLang.value, fromLang.value];
  [fromText.value, toText.value] = [toText.value, fromText.value];
  fromCount.textContent = `${fromText.value.length}/5000`;
});

fromSpeak.addEventListener('click', () => {
  const utterance = new SpeechSynthesisUtterance(fromText.value);
  utterance.lang = fromLang.value;
  speechSynthesis.speak(utterance);
});

toSpeak.addEventListener('click', () => {
  const utterance = new SpeechSynthesisUtterance(toText.value);
  utterance.lang = toLang.value;
  speechSynthesis.speak(utterance);
});

async function copyToClipboard(text, iconElement) {
  try {
    await navigator.clipboard.writeText(text);
    iconElement.setAttribute('data-lucide', 'check');
    iconElement.style.color = '#059669';
    lucide.createIcons();

    setTimeout(() => {
      iconElement.setAttribute('data-lucide', 'copy');
      iconElement.style.color = '';
      lucide.createIcons();
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text:', err);
  }
}

fromCopy.addEventListener('click', () => copyToClipboard(fromText.value, fromCopyIcon));
toCopy.addEventListener('click', () => copyToClipboard(toText.value, toCopyIcon));
favoriteBtn.addEventListener('click', toggleFavorite);
downloadBtn.addEventListener('click', downloadTranslation);

// Sidebar controls
historyBtn.addEventListener('click', () => {
  historySidebar.classList.add('active');
  updateHistoryDisplay();
});

favoritesBtn.addEventListener('click', () => {
  favoritesSidebar.classList.add('active');
  updateFavoritesDisplay();
});

closeHistory.addEventListener('click', () => {
  historySidebar.classList.remove('active');
});

closeFavorites.addEventListener('click', () => {
  favoritesSidebar.classList.remove('active');
});

// Initialize displays
updateHistoryDisplay();
updateFavoritesDisplay();