# Product Requirements Document (PRD)

## Project: Asma Ul Husna Learning Module (SnabbaLexinTSR)

### 1. Introduction

The **Asma Ul Husna Learning Module** is a premium, interactive web experience designed to help users learn, memorize, and understand the 99 Names of Allah (Asma Ul Husna). It combines modern web technologies with a spiritual and aesthetic design to create an engaging learning application.

### 2. Purpose and Goals

* **Facilitate Memorization**: Provide tools like Flashcards and Quizzes to aid in retaining the names.
* **Deepen Understanding**: specific meanings, categories (Jalal, Jamal, Kamal), and linguistic roots for each name.
* **Premium Experience**: Offer a visually stunning, high-quality interface that reflects the reverence of the content.
* **Accessibility**: Ensure the app is responsive, easy to navigate, and supports audio playback for pronunciation.

### 3. Key Features

#### 3.1. Browse Mode (The List)

* **Interactive Cards**:
  * **Collapsed View**: Displays the sequence number, category badge, Arabic/Swedish names, and quick action buttons (Audio, Memorize, Favorite).
  * **Expanded View**: Reveals deeper details including translations, Quranic verses, and linguistic conjugations.
* **Audio Playback**: High-quality pronunciation for every name.
* **Filtering & Sorting**:
  * Filter by Category: Jalal (Majesty), Jamal (Beauty), Kamal (Perfection).
  * Filter by Status: Favorites, Memorized.
* **Search**: Real-time search by Arabic or Swedish text and number.

#### 3.2. Flashcard Mode

* **Active Recall**: Users are presented with a card showing the Arabic name.
* **Flip Interaction**: Tapping the card flips it to reveal the Swedish meaning and transliteration.
* **Deck Management**: "I Know It" vs "Study Again" logic to prioritize difficult names.

#### 3.3. Quiz Mode

* **Assessment**: Multiple-choice or fill-in-the-blank questions.
* **Variety**:
  * Match Arabic to Swedish.
  * Match Meaning to Name.
* **Progress Tracking**: Score and feedback after each session.

### 4. User Experience (UX/UI)

* **Theme**: **Premium Dark Mode**. Deep black backgrounds (`#0a0a0f`) with Golden accents (`#fbbf24`).
* **Typography**: Elegant Arabic calligraphy fonts paired with clean sans-serif Swedish text.
* **Feedback**:
  * Subtle Golden Glow animations on active elements.
  * Instant interactions (no lag).
  * Haptic-like visual feedback on button clicks.

### 5. Technical Specifications

* **Frontend**: TypeScript, HTML5, CSS3 (Custom Properties).
* **State Management**: LocalStorage for persisting User Progress (Favorites, Memorized list).
* **Performance**: Optimized DOM manipulation, CSS hardware acceleration for animations.

### 6. Future Roadmap

* **Spaced Repetition System (SRS)**: Automated scheduling of flashcards based on user performance.
* **Social Sharing**: Share daily names or achievements images.
* **Gamification**: Badges and streaks for daily practice.
