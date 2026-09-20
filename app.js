/**
 * FLOOFY - Reimagined UX & Interactive Prototype Engine
 * Handles screen routing, pet deck swiping, emergency SOS simulation,
 * adoption CRM pipeline, and furry feed reader.
 */

// --- DATA STORE ---
const APP_DATA = {
  pets: [
    {
      id: "guddu",
      name: "Guddu",
      species: "dog",
      breed: "Labrador Retriever Mix",
      age: "2.5 Yrs",
      gender: "Male",
      size: "Medium",
      location: "Indiranagar, Bengaluru (2.4 km)",
      matchScore: 98,
      isUrgent: false,
      image: "assets/images/guddu.jpg",
      tags: ["House Trained", "Kid Friendly", "Vaccinated", "Loves Fetch"],
      traits: ["Gentle Giant", "Affectionate", "Calm in Car", "Apartment Friendly"],
      health: {
        vaccinated: "Complete (Rabies + DHPPiL)",
        dewormed: "Yes (Last: Aug 2026)",
        neutered: "Yes",
        microchipped: "Yes (9820003412)"
      },
      story: "Guddu was found abandoned near Ulsoor lake after his previous owners relocated. Despite a rough start, he is full of warmth, loves children, and is looking for a patient, loving family to cuddle on lazy Sunday afternoons.",
      fosterParent: "Pet-Rakshak Ananya (4.9 ⭐)"
    },
    {
      id: "lola",
      name: "Lola",
      species: "puppy",
      breed: "Shih-Tzu / Indie Mix",
      age: "4 Months",
      gender: "Female",
      size: "Small",
      location: "Koramangala, Bengaluru (4.1 km)",
      matchScore: 94,
      isUrgent: true,
      image: "assets/images/lola.jpg",
      tags: ["Puppy", "High Energy", "Vaccinated", "Hypoallergenic"],
      traits: ["Playful Zoomies", "Fast Learner", "Cuddle Bug"],
      health: {
        vaccinated: "1st & 2nd Booster Complete",
        dewormed: "Yes (Bi-weekly)",
        neutered: "Scheduled at 6 Months",
        microchipped: "Pending"
      },
      story: "Lola is a bundle of sheer joy! She was rescued from a construction site during heavy monsoon showers. She adores squeaky toys and will happily sleep on your lap during work calls.",
      fosterParent: "Pet-Rakshak Vikram (5.0 ⭐)"
    },
    {
      id: "monii",
      name: "Monii",
      species: "cat",
      breed: "Domestic Ginger Tabby",
      age: "1.5 Yrs",
      gender: "Female",
      size: "Small",
      location: "HSR Layout, Bengaluru (6.2 km)",
      matchScore: 91,
      isUrgent: false,
      image: "assets/images/monii.jpg",
      tags: ["Litter Box Trained", "Quiet", "Indoor Only", "Spayed"],
      traits: ["Purr Machine", "Window Watcher", "Independent"],
      health: {
        vaccinated: "Trivalent Feline Complete",
        dewormed: "Yes",
        neutered: "Spayed",
        microchipped: "Yes (4521098)"
      },
      story: "Monii was rescued from a parking lot where she sheltered inside a car engine. Today, she is the sweetest lap cat you could ever meet. Gentle head-scratches make her purr like an engine!",
      fosterParent: "Pet-Rakshak Dr. Priya (5.0 ⭐)"
    },
    {
      id: "bruno",
      name: "Bruno",
      species: "dog",
      breed: "Desi Indie Royal",
      age: "1 Yr",
      gender: "Male",
      size: "Medium",
      location: "Whitefield, Bengaluru (8.5 km)",
      matchScore: 99,
      isUrgent: false,
      image: "assets/images/bruno_indie.jpg",
      tags: ["Indie Hero", "Super Healthy", "Resilient", "Great Guard"],
      traits: ["Extremely Loyal", "Low Maintenance", "Alert & Loving"],
      health: {
        vaccinated: "Full Annual Coverage",
        dewormed: "Up to date",
        neutered: "Yes",
        microchipped: "Yes (98100234)"
      },
      story: "Bruno is an incredible survivor! Hit by a speeding bike 6 months ago, Pet-Rakshaks rallied for his surgery. He now runs like the wind with zero limp. Desi dogs have the biggest hearts!",
      fosterParent: "CUPA Foster Home (4.9 ⭐)"
    },
    {
      id: "rob",
      name: "Rob",
      species: "dog",
      breed: "Golden Retriever",
      age: "3 Yrs",
      gender: "Male",
      size: "Large",
      location: "Indiranagar, Bengaluru (1.8 km)",
      matchScore: 96,
      isUrgent: false,
      image: "assets/images/rob.jpg",
      tags: ["Senior Friendly", "Trained", "Water Lover"],
      traits: ["Sweet-Natured", "Calm", "Great with Toddlers"],
      health: {
        vaccinated: "Full Record Available",
        dewormed: "Yes",
        neutered: "Yes",
        microchipped: "Yes"
      },
      story: "Rob's human had to travel abroad for medical treatments and reluctantly put him up for adoption. He understands commands like sit, paw, wait, and heal. A gentleman dog.",
      fosterParent: "Pet-Rakshak Rohit (4.8 ⭐)"
    },
    {
      id: "kiku",
      name: "Kiku",
      species: "cat",
      breed: "Fluffy Calico Kitten",
      age: "3 Months",
      gender: "Female",
      size: "Small",
      location: "Jayanagar, Bengaluru (5.0 km)",
      matchScore: 93,
      isUrgent: true,
      image: "assets/images/kiku.jpg",
      tags: ["Kitten", "Playful", "Vaccinated"],
      traits: ["Curious Explorer", "Feather Wand Fanatic", "Softest Fur"],
      health: {
        vaccinated: "1st Dose Done",
        dewormed: "Yes",
        neutered: "Too Young (Scheduled)",
        microchipped: "Pending"
      },
      story: "Found tucked inside a carton behind a cafe, Kiku was bottle-fed by our volunteer team. She is healthy, mischievous, and ready to brighten any home!",
      fosterParent: "Pet-Rakshak Meera (5.0 ⭐)"
    }
  ],

  adopterPipelines: {
    guddu: [
      {
        id: "app-101",
        name: "Shashi Palakurty",
        avatar: "assets/images/shashi.jpg",
        isVerified: true,
        matchPercent: 96,
        city: "Indiranagar, Bengaluru",
        homeType: "Spacious 3BHK with Fenced Balcony",
        experience: "Previous Labrador owner for 8 yrs",
        familyConsent: "All 3 family members onboard",
        stage: "interested", // 'interested' | 'review' | 'homevisit' | 'adopted'
        appliedTime: "2 hours ago"
      },
      {
        id: "app-102",
        name: "Neha & Rohan Sen",
        avatar: "assets/images/hero_family.jpg",
        isVerified: true,
        matchPercent: 92,
        city: "Sarjapur Road, Bengaluru",
        homeType: "Villa with Private Garden Lawn",
        experience: "First time dog parents, took Floofy Prep Class",
        familyConsent: "Yes, 2 daughters eager to care",
        stage: "homevisit",
        appliedTime: "3 days ago"
      }
    ],
    lola: [
      {
        id: "app-201",
        name: "Aakash Verma",
        avatar: "assets/images/shashi.jpg",
        isVerified: true,
        matchPercent: 88,
        city: "Koramangala 4th Block",
        homeType: "Studio Apartment (Pet-friendly building)",
        experience: "Dog sitter for 2 years",
        familyConsent: "Lives alone, WFH full-time",
        stage: "interested",
        appliedTime: "5 hours ago"
      }
    ],
    monii: [
      {
        id: "app-301",
        name: "Dr. Kavita Nair",
        avatar: "assets/images/monii.jpg",
        isVerified: true,
        matchPercent: 98,
        city: "HSR Sector 2",
        homeType: "2BHK with Net-Protected Balconies",
        experience: "Has 1 friendly elderly rescue cat",
        familyConsent: "Fully supportive",
        stage: "review",
        appliedTime: "1 day ago"
      }
    ],
    rob: [
      {
        id: "app-401",
        name: "The Hegde Family",
        avatar: "assets/images/hero_family.jpg",
        isVerified: true,
        matchPercent: 99,
        city: "Indiranagar Defense Colony",
        homeType: "Bungalow with Lawn",
        experience: "Golden Retriever lovers for 15 yrs",
        familyConsent: "Unanimous",
        stage: "adopted",
        appliedTime: "Completed Aug 2026 🎉"
      }
    ]
  },

  feedStories: [
    {
      id: "croc-50",
      location: "Odisha, India",
      headline: "Odisha Celebrates 50 Years of Crocodile Conservation at Bhitarkanika",
      image: "assets/images/crocodile.jpg",
      date: "June 17, 2026 • 3 min read",
      category: "Wildlife Conservation",
      cheers: 428,
      snippet: "Odisha is celebrating 50 years of its pioneering crocodile conservation project launched in Bhitarkanika National Park. The sanctuary has grown from just 96 crocodiles in 1975 to over 1,800 healthy reptiles today.",
      fullStory: `Odisha is proudly celebrating 50 years of its landmark crocodile conservation project, originally spearheaded in 1975. The program, stationed at the lush Bhitarkanika National Park, commemorates its golden jubilee on World Crocodile Day.

Through meticulous egg protection, captive breeding, community river guards, and habitat preservation, the estuarine crocodile population in the mangrove delta has rebounded dramatically from near-extinction levels. 

Local wildlife conservator Dr. Sudhakar Kar highlighted that community involvement by riverbank villages was the single most vital factor in this international conservation triumph.`
    },
    {
      id: "bruno-recovery",
      location: "Bengaluru, India",
      headline: "From Hit-and-Run to Forever Couch: Bruno the Indie's 6-Month Miracle",
      image: "assets/images/bruno_indie.jpg",
      date: "2 days ago • 2 min read",
      category: "Rescue Spotlight",
      cheers: 894,
      snippet: "When Bruno was found on the Outer Ring Road with a fractured hip, 4 Pet-Rakshaks responded within 12 minutes. Today, his foster family made his adoption official!",
      fullStory: `Six months ago, a distress ping flashed on the Floofy app: an injured brown Indie dog was stranded on the median of Bengaluru's busy Outer Ring Road. Within 12 minutes, Pet-Rakshaks Ananya and Arvind arrived with a stretcher and rushed him to Cessna Vet Hospital.

After an intricate hip surgery and 8 weeks of hydrotherapy, Bruno made a 100% recovery. Last Saturday, his foster parents decided they couldn't bear to let him go and officially signed his adoption papers. 

"Desi dogs have an invincible spirit and unmatched loyalty," smiles adopter Rahul.`
    }
  ]
};

// --- APP STATE ---
const STATE = {
  currentScreen: "home",
  currentFilter: "all",
  activePetIndex: 0,
  selectedFosterPet: "guddu",
  isFullScreen: false,
  soundEnabled: true
};

// --- AUDIO SYNTH FOR HAPTIC SOUNDS ---
class SoundEffects {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }
  playTap() {
    if (!STATE.soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }
  playSuccess() {
    if (!STATE.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } catch (e) {}
  }
  playSos() {
    if (!STATE.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(500, now + 0.3);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }
}
const SFX = new SoundEffects();

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initPresentationControls();
  initNavigation();
  initHomeView();
  initAdoptView();
  initReportView();
  initManageView();
  initFeedView();
  initModals();

  // Dynamic Island interactive click
  document.getElementById("dynamicIsland").addEventListener("click", () => {
    showToast("🐾 Dynamic Island: Floofy Live Guard Active");
  });

  // User gesture to init Web Audio
  document.addEventListener("click", () => SFX.init(), { once: true });
});

// --- PRESENTATION & VIEW CONTROLLER ---
function initPresentationControls() {
  const stage = document.getElementById("appStage");
  const viewPhoneBtn = document.getElementById("viewPhoneBtn");
  const viewFullBtn = document.getElementById("viewFullBtn");
  const screenJumpBtns = document.querySelectorAll(".screen-jump-btn");

  viewPhoneBtn.addEventListener("click", () => {
    stage.classList.remove("mode-fullscreen");
    viewPhoneBtn.classList.add("active");
    viewFullBtn.classList.remove("active");
    STATE.isFullScreen = false;
    SFX.playTap();
  });

  viewFullBtn.addEventListener("click", () => {
    stage.classList.add("mode-fullscreen");
    viewFullBtn.classList.add("active");
    viewPhoneBtn.classList.remove("active");
    STATE.isFullScreen = true;
    SFX.playTap();
  });

  screenJumpBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetScreen = btn.getAttribute("data-screen");
      navigateTo(targetScreen);
    });
  });
}

// --- SCREEN NAVIGATION ---
function navigateTo(screenId) {
  STATE.currentScreen = screenId;
  SFX.playTap();

  // Update screen views
  document.querySelectorAll(".screen-view").forEach(view => {
    view.classList.remove("active");
  });
  const activeView = document.getElementById(`screen-${screenId}`);
  if (activeView) activeView.classList.add("active");

  // Update bottom nav bar buttons
  document.querySelectorAll(".nav-tab-btn").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-target") === screenId);
  });

  // Update presentation jump pills
  document.querySelectorAll(".screen-jump-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-screen") === screenId);
  });

  // Scroll viewport to top
  const container = document.getElementById("screensContainer");
  if (container) container.scrollTop = 0;
}

function initNavigation() {
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      if (target) navigateTo(target);
    });
  });

  // Header quick links
  const brandHome = document.getElementById("headerBrand");
  if (brandHome) brandHome.addEventListener("click", () => navigateTo("home"));

  const userAvatar = document.getElementById("userAvatarBtn");
  if (userAvatar) userAvatar.addEventListener("click", () => navigateTo("manage"));
}

// --- SCREEN 1: HOME VIEW ---
function initHomeView() {
  // Hero banner action
  const heroBtn = document.getElementById("heroActionBtn");
  if (heroBtn) {
    heroBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateTo("adopt");
    });
  }
  const heroCard = document.getElementById("heroBannerCard");
  if (heroCard) {
    heroCard.addEventListener("click", () => navigateTo("adopt"));
  }

  // Triad Actions
  const triadAdopt = document.getElementById("triadAdopt");
  if (triadAdopt) triadAdopt.addEventListener("click", () => navigateTo("adopt"));

  const triadRakshak = document.getElementById("triadRakshak");
  if (triadRakshak) triadRakshak.addEventListener("click", () => navigateTo("rakshak"));

  const triadReport = document.getElementById("triadReport");
  if (triadReport) triadReport.addEventListener("click", () => navigateTo("report"));

  // Spotlight Pets List
  const spotlightContainer = document.getElementById("spotlightScroll");
  if (spotlightContainer) {
    spotlightContainer.innerHTML = APP_DATA.pets.slice(0, 4).map(pet => `
      <div class="spotlight-card" onclick="openPetModal('${pet.id}')">
        <div class="spotlight-thumb-wrap">
          <img src="${pet.image}" alt="${pet.name}" class="spotlight-thumb" loading="lazy" />
          <span class="spotlight-tag">${pet.matchScore}% Match</span>
        </div>
        <div class="spotlight-body">
          <div class="spotlight-name">${pet.name}</div>
          <div class="spotlight-desc">${pet.breed} • ${pet.age}</div>
        </div>
      </div>
    `).join("");
  }
}

// --- SCREEN 2: ADOPT VIEW (SWIPE DECK & CATALOG GRID) ---
function initAdoptView() {
  renderPetDeck();
  renderPetGrid();

  // Filter Pills
  const filterPills = document.querySelectorAll("#adoptFilterPills .filter-pill");
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      STATE.currentFilter = pill.getAttribute("data-filter");
      SFX.playTap();
      renderPetDeck();
      renderPetGrid();
    });
  });

  // Switch between Deck Mode & Grid Mode
  const switchDeckBtn = document.getElementById("switchDeckBtn");
  const switchGridBtn = document.getElementById("switchGridBtn");
  const deckView = document.getElementById("swipeDeckContainer");
  const gridView = document.getElementById("catalogGridView");

  switchDeckBtn.addEventListener("click", () => {
    switchDeckBtn.classList.add("active");
    switchGridBtn.classList.remove("active");
    deckView.style.display = "flex";
    gridView.style.display = "none";
    SFX.playTap();
  });

  switchGridBtn.addEventListener("click", () => {
    switchGridBtn.classList.add("active");
    switchDeckBtn.classList.remove("active");
    deckView.style.display = "none";
    gridView.style.display = "grid";
    SFX.playTap();
  });

  // Deck Controls
  document.getElementById("btnRejectCard").addEventListener("click", () => swipeCurrentCard("left"));
  document.getElementById("btnHeartCard").addEventListener("click", () => swipeCurrentCard("right"));
  document.getElementById("btnRewindCard").addEventListener("click", () => rewindDeck());
  document.getElementById("btnInfoCard").addEventListener("click", () => {
    const visiblePets = getFilteredPets();
    if (visiblePets[STATE.activePetIndex]) {
      openPetModal(visiblePets[STATE.activePetIndex].id);
    }
  });

  // Live Search
  const searchInput = document.getElementById("petSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      renderPetGrid(q);
    });
  }
}

function getFilteredPets() {
  if (STATE.currentFilter === "all") return APP_DATA.pets;
  if (STATE.currentFilter === "dogs") return APP_DATA.pets.filter(p => p.species === "dog");
  if (STATE.currentFilter === "cats") return APP_DATA.pets.filter(p => p.species === "cat");
  if (STATE.currentFilter === "puppy") return APP_DATA.pets.filter(p => p.species === "puppy");
  if (STATE.currentFilter === "urgent") return APP_DATA.pets.filter(p => p.isUrgent);
  return APP_DATA.pets;
}

function renderPetDeck() {
  const cardDeck = document.getElementById("cardDeck");
  if (!cardDeck) return;
  const pets = getFilteredPets();
  cardDeck.innerHTML = "";

  if (pets.length === 0) {
    cardDeck.innerHTML = `
      <div style="text-align:center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size:28px;">🐾</p>
        <p style="font-weight:700; margin-top:8px;">No pets match this filter</p>
      </div>`;
    return;
  }

  // Render top 3 stacked cards
  pets.slice(0, 3).forEach((pet, index) => {
    const card = document.createElement("div");
    card.className = "tinder-card";
    card.id = `deck-card-${index}`;
    card.style.zIndex = 10 - index;
    card.style.transform = `scale(${1 - index * 0.04}) translateY(${index * 12}px)`;
    card.style.opacity = index > 2 ? 0 : 1;

    card.innerHTML = `
      <img src="${pet.image}" alt="${pet.name}" class="tinder-card-photo" draggable="false" />
      <div class="card-top-tags">
        <span class="match-score-badge">✨ ${pet.matchScore}% Match</span>
        ${pet.isUrgent ? `<span class="urgent-badge">🚨 Urgent Foster</span>` : `<span style="background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);color:#FFF;padding:3px 8px;border-radius:99px;font-size:10px;font-weight:700;">📍 ${pet.location.split('(')[0]}</span>`}
      </div>
      <div class="tinder-card-overlay">
        <div class="card-pet-meta">
          <div class="card-pet-name">${pet.name} <span style="font-size:16px;">${pet.gender === 'Male' ? '♂️' : '♀️'}</span></div>
          <div class="card-pet-subtitle">${pet.breed} • ${pet.age}</div>
        </div>
        <div class="card-traits-row">
          ${pet.traits.map(t => `<span class="trait-chip">${t}</span>`).join("")}
        </div>
      </div>
    `;

    // Make top card draggable
    if (index === 0) {
      setupDragGesture(card, pet);
    }

    cardDeck.appendChild(card);
  });
}

function setupDragGesture(card, pet) {
  let isDragging = false;
  let startX = 0;
  let currentX = 0;

  const onStart = (e) => {
    isDragging = true;
    startX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    card.style.transition = "none";
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const x = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    currentX = x - startX;
    const rotate = currentX * 0.08;
    card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    card.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    if (currentX > 100) {
      swipeCurrentCard("right");
    } else if (currentX < -100) {
      swipeCurrentCard("left");
    } else {
      card.style.transform = "translateX(0px) rotate(0deg)";
    }
  };

  card.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);

  card.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onEnd);
}

function swipeCurrentCard(direction) {
  const pets = getFilteredPets();
  const topCard = document.getElementById("deck-card-0");
  if (!topCard || pets.length === 0) return;

  const currentPet = pets[0];
  const targetX = direction === "right" ? 500 : -500;
  const targetRotate = direction === "right" ? 25 : -25;

  topCard.style.transition = "transform 0.35s ease, opacity 0.35s ease";
  topCard.style.transform = `translateX(${targetX}px) rotate(${targetRotate}deg)`;
  topCard.style.opacity = "0";

  if (direction === "right") {
    SFX.playSuccess();
    showToast(`🧡 Added ${currentPet.name} to your shortlist!`);
  } else {
    SFX.playTap();
  }

  setTimeout(() => {
    // Cycle the pet to end of array for endless browsing demo
    const removed = pets.shift();
    pets.push(removed);
    renderPetDeck();
  }, 280);
}

function rewindDeck() {
  const pets = getFilteredPets();
  if (pets.length > 0) {
    const last = pets.pop();
    pets.unshift(last);
    renderPetDeck();
    SFX.playTap();
    showToast("⏪ Rewound previous pet card");
  }
}

function renderPetGrid(filterQuery = "") {
  const gridContainer = document.getElementById("catalogGridView");
  if (!gridContainer) return;
  let pets = getFilteredPets();

  if (filterQuery) {
    pets = pets.filter(p => p.name.toLowerCase().includes(filterQuery) || p.breed.toLowerCase().includes(filterQuery));
  }

  document.getElementById("adoptResultsCount").textContent = `${pets.length} pets found`;

  gridContainer.innerHTML = pets.map(pet => `
    <div class="grid-pet-card" onclick="openPetModal('${pet.id}')">
      <div class="grid-photo-wrap">
        <img src="${pet.image}" alt="${pet.name}" loading="lazy" />
        <span class="grid-match-tag">★ ${pet.matchScore}%</span>
      </div>
      <div class="grid-card-body">
        <div class="grid-name-row">
          <span class="grid-pet-name">${pet.name}</span>
          <span style="font-size:12px;">${pet.gender === 'Male' ? '♂️' : '♀️'}</span>
        </div>
        <div class="grid-pet-details">${pet.breed} • ${pet.age}</div>
        <div class="grid-distance-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
          ${pet.location.split('(')[0]}
        </div>
        <div class="grid-action-row">
          <div class="grid-btn-details">View Profile</div>
        </div>
      </div>
    </div>
  `).join("");
}

// --- SCREEN 3: REPORT ANIMAL CRUELTY / EMERGENCY SOS ---
function initReportView() {
  // Distress category selector chips
  const chips = document.querySelectorAll(".distress-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      SFX.playTap();
    });
  });

  // Photo upload trigger demo
  const uploadSlots = document.querySelectorAll(".upload-slot");
  uploadSlots.forEach((slot, idx) => {
    slot.addEventListener("click", () => {
      // Simulate adding sample evidence photo
      const samplePhotos = [
        "assets/images/bruno_indie.jpg",
        "assets/images/rescue_banner.jpg",
        "assets/images/guddu.jpg"
      ];
      slot.innerHTML = `<img src="${samplePhotos[idx % samplePhotos.length]}" alt="Evidence" style="width:100%;height:100%;object-fit:cover;" />`;
      SFX.playSuccess();
      showToast("📷 Photo attached for verification");
    });
  });

  // GPS Locate Button
  const gpsBtn = document.getElementById("gpsLocateBtn");
  if (gpsBtn) {
    gpsBtn.addEventListener("click", () => {
      SFX.playTap();
      showToast("📍 High-accuracy GPS location locked: Indiranagar 12th Main");
    });
  }

  // Broadcast SOS Button
  const sosBtn = document.getElementById("broadcastSosBtn");
  if (sosBtn) {
    sosBtn.addEventListener("click", () => {
      triggerSosDispatch();
    });
  }
}

function triggerSosDispatch() {
  SFX.playSos();

  // Show live radar dispatch modal
  const modal = document.getElementById("sosDispatchModal");
  modal.classList.add("active");

  const island = document.getElementById("dynamicIsland");
  island.classList.add("active-sos");
  document.getElementById("islandText").innerHTML = `<span style="color:#EE3E38;">● SOS</span> Dispatching...`;

  const statusText = document.getElementById("dispatchStatusText");
  const subText = document.getElementById("dispatchSubText");
  const responderBox = document.getElementById("responderProfileBox");

  statusText.textContent = "Broadcasting to 14 Pet-Rakshaks...";
  subText.textContent = "Searching 5 km radius in Indiranagar";
  responderBox.style.display = "none";

  setTimeout(() => {
    statusText.textContent = "Pet-Rakshak Vikram (1.2 km away) ACCEPTED!";
    subText.textContent = "Animal Rescue Van en route. ETA: 8 minutes.";
    responderBox.style.display = "flex";
    SFX.playSuccess();
    document.getElementById("islandText").innerHTML = `<span style="color:#25835C;">🚑 ETA 8m</span> Vikram`;
  }, 2200);
}

// --- SCREEN 4: MANAGE ADOPTIONS (RESCUER CRM) ---
function initManageView() {
  renderPetFosterPills();
  renderAdoptionPipeline();

  const addPetBtn = document.getElementById("btnAddPetCrm");
  if (addPetBtn) {
    addPetBtn.addEventListener("click", () => {
      SFX.playTap();
      showToast("📝 Add New Foster Pet profile form opened");
    });
  }
}

function renderPetFosterPills() {
  const container = document.getElementById("petSelectorBar");
  if (!container) return;

  const fosterPets = [
    { id: "guddu", name: "Guddu", img: "assets/images/guddu.jpg", apps: 2 },
    { id: "lola", name: "Lola", img: "assets/images/lola.jpg", apps: 1 },
    { id: "monii", name: "Monii", img: "assets/images/monii.jpg", apps: 1 },
    { id: "rob", name: "Rob", img: "assets/images/rob.jpg", apps: 0 }
  ];

  container.innerHTML = fosterPets.map(pet => `
    <div class="pet-select-item ${STATE.selectedFosterPet === pet.id ? 'active' : ''}" onclick="selectFosterPet('${pet.id}')">
      <div class="select-avatar-wrap">
        <img src="${pet.img}" alt="${pet.name}" />
        ${pet.apps > 0 ? `<span class="select-app-badge">${pet.apps}</span>` : ''}
      </div>
      <span class="select-name">${pet.name}</span>
    </div>
  `).join("");
}

function selectFosterPet(petId) {
  STATE.selectedFosterPet = petId;
  SFX.playTap();
  renderPetFosterPills();
  renderAdoptionPipeline();
}

function renderAdoptionPipeline() {
  const container = document.getElementById("pipelineContainer");
  if (!container) return;

  const applicants = APP_DATA.adopterPipelines[STATE.selectedFosterPet] || [];
  
  // Stages
  const stages = [
    { key: "interested", title: "Interested Adopters", desc: "New candidate applications submitted", color: "var(--amber)" },
    { key: "review", title: "Under Consideration & Review", desc: "Background and housing verification in progress", color: "var(--azure)" },
    { key: "homevisit", title: "Home Visit & Final Check", desc: "Scheduled home walk-through before final handover", color: "var(--violet)" },
    { key: "adopted", title: "Happily Adopted! 🎉", desc: "Forever home match completed & certificate issued", color: "var(--sage)" }
  ];

  container.innerHTML = stages.map(stage => {
    const list = applicants.filter(a => a.stage === stage.key);
    return `
      <div class="pipeline-stage-box">
        <div class="pipeline-stage-header">
          <div class="stage-title-wrap">
            <span class="stage-indicator-dot" style="background:${stage.color};"></span>
            <span class="stage-name">${stage.title}</span>
          </div>
          <span class="stage-count-badge">${list.length}</span>
        </div>
        <div class="stage-desc">${stage.desc}</div>
        <div class="stage-cards-col">
          ${list.length === 0 ? `
            <div class="pipeline-empty-state">
              <span>No applicants in this round</span>
            </div>
          ` : list.map(adopter => `
            <div class="adopter-card">
              <div class="adopter-header-row">
                <img src="${adopter.avatar}" class="adopter-avatar" alt="${adopter.name}" />
                <div class="adopter-info-col">
                  <div class="adopter-name-badge">
                    <span class="adopter-name">${adopter.name}</span>
                    ${adopter.isVerified ? `<span class="verified-adopter-badge">✓ Verified</span>` : ''}
                  </div>
                  <div class="adopter-quick-meta">📍 ${adopter.city} • Applied ${adopter.appliedTime}</div>
                </div>
              </div>

              <div class="adopter-match-meter">
                <span>Compatibility: <strong class="meter-score">${adopter.matchPercent}% Match</strong></span>
                <span>• ${adopter.homeType.split('(')[0]}</span>
              </div>

              <div class="adopter-actions-row">
                <button class="btn-crm-action btn-crm-review" onclick="openAdopterModal('${adopter.id}')">Review Dossier</button>
                <button class="btn-crm-action btn-crm-schedule" onclick="scheduleHomeVisit('${adopter.name}')">Schedule Visit</button>
                <button class="btn-crm-action btn-crm-advance" onclick="advanceAdopterStage('${adopter.id}')">Advance ➔</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function advanceAdopterStage(adopterId) {
  const applicants = APP_DATA.adopterPipelines[STATE.selectedFosterPet] || [];
  const item = applicants.find(a => a.id === adopterId);
  if (!item) return;

  const stageOrder = ["interested", "review", "homevisit", "adopted"];
  const currIdx = stageOrder.indexOf(item.stage);
  if (currIdx < stageOrder.length - 1) {
    item.stage = stageOrder[currIdx + 1];
    SFX.playSuccess();
    showToast(`✅ Moved ${item.name} to "${item.stage.toUpperCase()}" stage!`);
    renderAdoptionPipeline();
  } else {
    showToast(`🎉 ${item.name} is already happily adopted!`);
  }
}

function scheduleHomeVisit(name) {
  SFX.playTap();
  showToast(`📅 Home visit invite sent to ${name} for this Sunday at 4:00 PM`);
}

// --- SCREEN 5: FURRY FEED (COMMUNITY & STORIES) ---
function initFeedView() {
  const container = document.getElementById("feedListContainer");
  if (!container) return;

  container.innerHTML = APP_DATA.feedStories.map(story => `
    <div class="feed-story-card" onclick="openStoryModal('${story.id}')">
      <div class="feed-hero-img-box">
        <img src="${story.image}" alt="${story.headline}" loading="lazy" />
      </div>
      <div class="feed-story-body">
        <div class="feed-story-loc">${story.location} • ${story.category}</div>
        <h3 class="feed-story-title">${story.headline}</h3>
        <p class="feed-story-p">${story.snippet}</p>
        <div class="feed-story-actions">
          <div class="feed-cheer-btn" onclick="cheerStory(event, '${story.id}')">
            <span>🐾</span> <span id="cheer-count-${story.id}">${story.cheers}</span> Cheers
          </div>
          <button class="btn-read-full">Read Full Story ➔</button>
        </div>
      </div>
    </div>
  `).join("");
}

function cheerStory(event, storyId) {
  event.stopPropagation();
  const story = APP_DATA.feedStories.find(s => s.id === storyId);
  if (story) {
    story.cheers += 1;
    const el = document.getElementById(`cheer-count-${storyId}`);
    if (el) el.textContent = story.cheers;
    SFX.playSuccess();
    showToast("🐾 Cheered for this inspiring animal story!");
  }
}

// --- MODALS & DRAWERS ---
function initModals() {
  // Close buttons on all modals
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
        SFX.playTap();
      }
    });
  });

  document.querySelectorAll(".btn-close-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-overlay");
      if (modal) modal.classList.remove("active");
      SFX.playTap();
    });
  });
}

// Open Pet Detail Bottom Sheet
window.openPetModal = function(petId) {
  const pet = APP_DATA.pets.find(p => p.id === petId);
  if (!pet) return;

  const modal = document.getElementById("petDetailModal");
  const body = document.getElementById("petDetailModalBody");

  body.innerHTML = `
    <img src="${pet.image}" class="pet-sheet-hero-img" alt="${pet.name}" />
    
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <h2 style="font-size:22px; font-weight:800; color:var(--text-main);">${pet.name} <span style="font-size:16px;">${pet.gender === 'Male' ? '♂️' : '♀️'}</span></h2>
        <div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">${pet.breed} • ${pet.age} • ${pet.size}</div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">📍 ${pet.location}</div>
      </div>
      <div class="match-score-badge" style="font-size:12px; padding:6px 12px;">★ ${pet.matchScore}% Match</div>
    </div>

    <div style="display:flex; gap:6px; flex-wrap:wrap;">
      ${pet.tags.map(t => `<span class="trait-chip" style="background:var(--primary-soft); color:var(--primary); border-color:#FFD9CE;">${t}</span>`).join("")}
    </div>

    <div>
      <h4 style="font-size:13px; font-weight:800; margin-bottom:6px;">Story & Temperament</h4>
      <p style="font-size:12px; color:var(--text-secondary); line-height:1.5;">${pet.story}</p>
    </div>

    <div>
      <h4 style="font-size:13px; font-weight:800; margin-bottom:8px;">Verified Medical Passport</h4>
      <div class="sheet-health-grid">
        <div class="health-item"><span class="health-check-icon">✓</span> Vaccinated: ${pet.health.vaccinated}</div>
        <div class="health-item"><span class="health-check-icon">✓</span> Dewormed: ${pet.health.dewormed}</div>
        <div class="health-item"><span class="health-check-icon">✓</span> Neutered: ${pet.health.neutered}</div>
        <div class="health-item"><span class="health-check-icon">✓</span> Microchip: ${pet.health.microchipped}</div>
      </div>
    </div>

    <div style="background:#FAF7F4; border-radius:var(--radius-sm); padding:10px 12px; display:flex; align-items:center; justify-content:space-between;">
      <div>
        <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Foster Guardian</div>
        <div style="font-size:12px; font-weight:800; color:var(--text-main);">${pet.fosterParent}</div>
      </div>
      <button class="btn-crm-action btn-crm-review" style="padding:6px 12px;" onclick="showToast('💬 Foster Chat opened with ${pet.fosterParent.split(' ')[1]}')">Chat with Foster</button>
    </div>

    <div style="display:flex; gap:10px; margin-top:8px;">
      <button class="broadcast-sos-btn" style="background:var(--primary); box-shadow:var(--shadow-primary);" onclick="startAdoptionFlow('${pet.name}')">
        Apply to Adopt ${pet.name} ➔
      </button>
    </div>
  `;

  modal.classList.add("active");
  SFX.playTap();
};

window.startAdoptionFlow = function(petName) {
  document.getElementById("petDetailModal").classList.remove("active");
  SFX.playSuccess();
  showToast(`📋 Adoption application for ${petName} submitted for Pet-Rakshak review!`);
};

// Open Adopter Dossier Modal
window.openAdopterModal = function(adopterId) {
  const applicants = APP_DATA.adopterPipelines[STATE.selectedFosterPet] || [];
  const adopter = applicants.find(a => a.id === adopterId);
  if (!adopter) return;

  const modal = document.getElementById("adopterDetailModal");
  const body = document.getElementById("adopterDetailModalBody");

  body.innerHTML = `
    <div style="display:flex; align-items:center; gap:14px;">
      <img src="${adopter.avatar}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);" />
      <div>
        <h3 style="font-size:18px; font-weight:800; color:var(--text-main);">${adopter.name}</h3>
        <div style="font-size:12px; color:var(--sage); font-weight:700;">✓ Govt ID & Residence Verified</div>
        <div style="font-size:11px; color:var(--text-muted);">Applied ${adopter.appliedTime}</div>
      </div>
    </div>

    <div style="background:#FAF7F4; border-radius:var(--radius-sm); padding:12px; display:flex; flex-direction:column; gap:8px;">
      <div style="font-size:12px;"><strong>📍 Living Situation:</strong> ${adopter.homeType}</div>
      <div style="font-size:12px;"><strong>🐾 Pet Experience:</strong> ${adopter.experience}</div>
      <div style="font-size:12px;"><strong>👨‍👩‍👧 Family Consent:</strong> ${adopter.familyConsent}</div>
      <div style="font-size:12px;"><strong>★ Match Score:</strong> ${adopter.matchPercent}% compatibility for this pet</div>
    </div>

    <div style="display:flex; gap:8px; margin-top:10px;">
      <button class="broadcast-sos-btn" style="background:var(--sage); box-shadow:none; flex:1;" onclick="advanceAdopterStage('${adopter.id}'); document.getElementById('adopterDetailModal').classList.remove('active');">
        Approve & Shortlist ✓
      </button>
      <button class="broadcast-sos-btn" style="background:#F4EFEB; color:var(--text-main); box-shadow:none; flex:1;" onclick="document.getElementById('adopterDetailModal').classList.remove('active');">
        Close
      </button>
    </div>
  `;

  modal.classList.add("active");
  SFX.playTap();
};

// Open Story Detail Modal
window.openStoryModal = function(storyId) {
  const story = APP_DATA.feedStories.find(s => s.id === storyId);
  if (!story) return;

  const modal = document.getElementById("storyDetailModal");
  const body = document.getElementById("storyDetailModalBody");

  body.innerHTML = `
    <img src="${story.image}" style="width:100%; height:200px; border-radius:var(--radius-md); object-fit:cover;" />
    <div>
      <div style="font-size:11px; font-weight:800; color:var(--azure); text-transform:uppercase;">${story.location} • ${story.date}</div>
      <h2 style="font-size:19px; font-weight:800; color:var(--text-main); margin-top:4px; line-height:1.3;">${story.headline}</h2>
    </div>
    <div style="font-size:13px; color:var(--text-secondary); line-height:1.6; white-space:pre-line;">
      ${story.fullStory}
    </div>
    <div style="display:flex; gap:10px; padding-top:12px; border-top:1px solid var(--border-subtle);">
      <button class="broadcast-sos-btn" style="background:var(--primary); box-shadow:var(--shadow-primary); flex:1;" onclick="showToast('❤️ Micro-donation of ₹100 processed for this mission!')">
        Donate to Wildlife Care
      </button>
      <button class="broadcast-sos-btn" style="background:var(--amber); color:#1A1815; box-shadow:none; width:auto; padding:12px 18px;" onclick="showToast('🔗 Story link copied to share!')">
        Share
      </button>
    </div>
  `;

  modal.classList.add("active");
  SFX.playTap();
};

// Toast notification helper
function showToast(text) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.innerHTML = `<span>${text}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
