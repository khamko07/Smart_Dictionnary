// Global variables
const searchInput = document.querySelector(".search-input");
const searchBtn = document.querySelector(".search-btn");
const voiceSearchBtn = document.querySelector(".voice-search-btn");
const resultContainer = document.querySelector(".result-container");
const themeToggle = document.querySelector(".theme-toggle");
const recentList = document.querySelector(".recent-list");
const wodContent = document.getElementById("wod-content");

// Array to store recent searches
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];

// Theme handling
let isDarkMode = localStorage.getItem("darkMode") === "true";
if (isDarkMode) {
  document.body.classList.add("dark-mode");
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  isDarkMode = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);
  themeToggle.innerHTML = isDarkMode
    ? '<i class="fas fa-sun"></i>'
    : '<i class="fas fa-moon"></i>';
});

// Voice search functionality
const speechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
if (speechRecognition) {
  const recognition = new speechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const word = event.results[0][0].transcript;
    searchInput.value = word;
    searchWord(word);
  };

  voiceSearchBtn.addEventListener("click", () => {
    recognition.start();
    voiceSearchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  });

  recognition.onend = () => {
    voiceSearchBtn.innerHTML = '<i class="fas fa-microphone"></i>';
  };
} else {
  voiceSearchBtn.style.display = "none";
}

// Search functionality
async function searchWord(word) {
  try {
    resultContainer.innerHTML = '<div class="loading">Searching...</div>';
    resultContainer.classList.add("active");

    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    if (!response.ok) throw new Error("Word not found");

    const data = await response.json();
    displayResults(data[0]);
    updateRecentSearches(word);
  } catch (error) {
    displayError(error.message);
  }
}

// Display results
function displayResults(data) {
  const { word, phonetics, meanings } = data;

  let phoneticText = "";
  let audioUrl = "";

  if (phonetics.length > 0) {
    phoneticText = phonetics.find((p) => p.text)?.text || "";
    audioUrl = phonetics.find((p) => p.audio)?.audio || "";
  }

  let html = `
                <div class="word-details">
                    <div>
                        <h2 class="word-title">${word}</h2>
                        <p class="phonetic">${phoneticText}</p>
                    </div>
                    ${
                      audioUrl
                        ? `
                        <button class="audio-btn" onclick="playAudio('${audioUrl}')">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    `
                        : ""
                    }
                </div>
                <div class="meanings-container">
            `;

  meanings.forEach((meaning) => {
    html += `
                    <div class="meaning">
                        <h3 class="part-of-speech">${meaning.partOfSpeech}</h3>
                        ${meaning.definitions
                          .map(
                            (def) => `
                            <div class="definition">
                                <p>${def.definition}</p>
                                ${
                                  def.example
                                    ? `
                                    <p class="example">"${def.example}"</p>
                                `
                                    : ""
                                }
                            </div>
                        `
                          )
                          .join("")}
                        
                        ${
                          meaning.synonyms.length > 0
                            ? `
                            <div class="synonyms">
                                <h4>Synonyms:</h4>
                                <div class="chips">
                                    ${meaning.synonyms
                                      .map(
                                        (syn) => `
                                        <span class="chip" onclick="searchWord('${syn}')">${syn}</span>
                                    `
                                      )
                                      .join("")}
                                </div>
                            </div>
                        `
                            : ""
                        }

                        ${
                          meaning.antonyms.length > 0
                            ? `
                            <div class="antonyms">
                                <h4>Antonyms:</h4>
                                <div class="chips">
                                    ${meaning.antonyms
                                      .map(
                                        (ant) => `
                                        <span class="chip" onclick="searchWord('${ant}')">${ant}</span>
                                    `
                                      )
                                      .join("")}
                                </div>
                            </div>
                        `
                            : ""
                        }
                    </div>
                `;
  });

  html += "</div>";
  resultContainer.innerHTML = html;
  resultContainer.classList.add("active");
}

// Error handling
function displayError(message) {
  resultContainer.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                </div>
            `;
  resultContainer.classList.add("active");
}

// Audio playback
function playAudio(url) {
  new Audio(url).play();
}

// Recent searches handling
function updateRecentSearches(word) {
  if (!recentSearches.includes(word)) {
    recentSearches.unshift(word);
    if (recentSearches.length > 5) recentSearches.pop();
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
    displayRecentSearches();
  }
}

function displayRecentSearches() {
  recentList.innerHTML = recentSearches
    .map(
      (word) => `
                <div class="recent-item" onclick="searchWord('${word}')">${word}</div>
            `
    )
    .join("");
}

// Word of the Day functionality
async function getWordOfDay() {
  const commonWords = [
    "happy",
    "success",
    "peace",
    "love",
    "courage",
    "wisdom",
    "hope",
  ];
  const randomWord =
    commonWords[Math.floor(Math.random() * commonWords.length)];

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${randomWord}`
    );
    const data = await response.json();

    wodContent.innerHTML = `
                    <h3>${data[0].word}</h3>
                    <p>${data[0].meanings[0].definitions[0].definition}</p>
                `;
  } catch (error) {
    wodContent.innerHTML = "<p>Failed to load Word of the Day</p>";
  }
}

// Event listeners
searchBtn.addEventListener("click", () => {
  const word = searchInput.value.trim();
  if (word) searchWord(word);
});

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    const word = searchInput.value.trim();
    if (word) searchWord(word);
  }
});

// Initialize
displayRecentSearches();
getWordOfDay();
