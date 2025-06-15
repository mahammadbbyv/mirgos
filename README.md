# Project: Mirgos - Geopolitical Strategy Game

## 📜 Project Overview

Mirgos is a web-based multiplayer geopolitical strategy game where players aim for world domination. Players manage cities, build armies, develop nuclear weapons, engage in diplomacy, and impose sanctions to outperform their opponents. The game features real-time interactions, a lobby system for matchmaking, and in-game chat capabilities.

This project is built with a modern web stack:

* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Real-time Communication:** Socket.IO with enhanced reliability
* **Database:** MSSQL
* **Authentication:** JWT (JSON Web Tokens)
* **Enhanced Visuals:** Interactive Game Board with improved UX

### ✨ Key Technical Features

* **Multiplayer Gameplay:** Supports multiple players competing simultaneously.
* **Lobby System:** Allows players to create, find, and join game lobbies. Includes a waiting room functionality.
* **User Authentication:** Secure registration and login system.
* **Real-time Chat:** Facilitates communication between players within the game (all chat and private messages).
* **Modular Frontend:** Components for Game HUD, Lobby, Chat, etc., built with React.
* **RESTful API & WebSockets:** Backend powered by Node.js/Express for handling game logic, data persistence, and real-time updates via Socket.IO.
* **Enhanced Socket Reliability:** Custom hook for improved connection management with automatic retries and diagnostics.
* **Interactive Game Board:** Visual representation of countries and cities with interactive controls.
* **Advanced Diagnostics:** Built-in tools for diagnosing and resolving connection issues.
* **Localization:** Designed to support multiple languages.

---

## 🔌 Enhanced Socket Connection

The game uses a custom `useSocket` hook for improved reliability in real-time communications:

* **Automatic reconnection:** Handles temporary disconnections gracefully
* **Error resilience:** Better error handling and reporting
* **Request retries:** Automatically retries failed operations
* **Connection monitoring:** Real-time status tracking
* **Performance optimization:** Reduces latency and improves responsiveness

## 🎮 Enhanced Game Interface

The new `EnhancedGameBoard` component provides:

* **Visual game map:** Interactive representation of countries and cities
* **Real-time updates:** See game state changes immediately
* **Streamlined controls:** Easier interaction for attacks and upgrades
* **Improved feedback:** Visual cues for actions and outcomes
* **Responsive design:** Works well on different screen sizes

## 🛠️ Diagnostic Tools

Included diagnostic utilities help identify and resolve connection issues:

* **socket-diagnostics.js:** JavaScript tool for detailed connection analysis
* **diagnose-socket.ps1:** PowerShell script for network and system diagnosis
* **Connection monitoring:** Real-time connection status in the game UI

---

## 🌍 GEOPOLITICAL STRATEGY GAME: "World Domination"

### 🎯 OBJECTIVE

Control and develop cities, build armies, use nuclear weapons, impose sanctions, and dominate the map. Win by having the highest stability, income, and military power.

### 🧩 CORE ELEMENTS

#### 🏙️ Cities

* 🛡️ Shield — defense level (0–3)
* 💰 Income — money generated each turn
* 📈 Level — development level (affects shield and income)
* 📊 Stability — internal order (0–100)
* 🪖 Defenders — defending troops
* 🔧 Repair Cost — cost to repair the city after attacks

Players can upgrade cities or attack others.

#### 💰 Budget

* Earned from cities each turn.
* Spent on army, nuclear development, repairs, upgrades.

### ⚔️ MILITARY ACTIONS

#### 🪖 Army

* Cost per unit: $300
* Used to attack and defend cities.
* Battles are calculated based on defenders, shields, and attacking forces.

#### 🔥 Attacks

* Player selects a target city.
* If the attack force exceeds defense, the city is captured.
* Success reduces target's stability.

### ☢️ NUCLEAR WEAPONS

#### 🔬 Development

* Levels: 1–3
* Cost per level: $450
* Success chance for bomb creation: 50%

#### 💥 Use

* Deals massive damage, reduces global stability.
* May trigger sanctions.

### 🧨 SANCTIONS

* Players may vote to sanction aggressive players.
* Sanctions suspend income for 1–3 turns.
* Powerful players may impose sanctions unilaterally.

### 🌐 DIPLOMACY

* Players may form alliances.
* Trade resources.
* Launch joint sanctions or strikes.

### 🧠 GAME TURN

1. Collect income.
2. Choose action:
    * Upgrade a city.
    * Buy army units.
    * Attack another player.
    * Develop nuclear technology.
    * Impose sanctions.
3. Resolve actions and update city status.

### 🏁 WINNING

* Turn limit reached (e.g., 20 turns), or
* A player controls 70% of cities, or
* A player reaches 500 total stability points.

