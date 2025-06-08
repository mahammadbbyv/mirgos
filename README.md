# Project: Mirgos - Geopolitical Strategy Game

## 📜 Project Overview

Mirgos is a web-based multiplayer geopolitical strategy game where players aim for world domination. Players manage cities, build armies, develop nuclear weapons, engage in diplomacy, and impose sanctions to outperform their opponents. The game features real-time interactions, a lobby system for matchmaking, and in-game chat capabilities.

This project is built with a modern web stack:

* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Real-time Communication:** Socket.IO
* **Database:** MSSQL
* **Authentication:** JWT (JSON Web Tokens)

### ✨ Key Technical Features

* **Multiplayer Gameplay:** Supports multiple players competing simultaneously.
* **Lobby System:** Allows players to create, find, and join game lobbies. Includes a waiting room functionality.
* **User Authentication:** Secure registration and login system.
* **Real-time Chat:** Facilitates communication between players within the game (all chat and private messages).
* **Modular Frontend:** Components for Game HUD, Lobby, Chat, etc., built with React.
* **RESTful API & WebSockets:** Backend powered by Node.js/Express for handling game logic, data persistence, and real-time updates via Socket.IO.
* **Localization:** Designed to support multiple languages.

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

