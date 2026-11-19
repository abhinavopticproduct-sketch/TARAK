# Jalebi-Fafda Morning Rush 🥨
> An HTML5 Canvas web game inspired by *Taarak Mehta Ka Ooltah Chashmah* (TMKOC).

Help Jethalal catch his Sunday morning breakfast in the Gokuldham Society compound before Daya calls him!

---

## 🎮 How to Play

- **Goal:** Catch falling Jalebis, Faludas, and Masala Chai on Jethalal's shiny steel plate while avoiding bitter Karela Juice, Sundarlal's Taxi Bills, and flying Chappals!
- **Reach 500 Points:** Unlocks the official **Gokuldham Society Special Notice Board** with a personalized Suvichar and message.
- **Controls:**
  - 📱 **Mobile Touch:** Drag your thumb anywhere horizontally on the screen.
  - 💻 **Desktop:** Left / Right Arrow keys or `A` / `D` keys.
  - ⚡ **Message Preview Shortcut:** Press `Shift + W` on desktop anytime to immediately preview the 500-point Notice Board modal!

---

## 🍽️ Collectibles & Hazards

| Item | Type | Effect |
| :--- | :--- | :--- |
| **Jalebi** (`./photos/jalebi.svg`) | Collectible | **+10 pts** |
| **Faluda** (`./photos/faluda.svg`) | Collectible | **+15 pts** |
| **Masala Chai** (Vector art) | Bonus Collectible | **+25 pts** (Hot steaming tea!) |
| **Babita Ji** (`./photos/babita.svg`) | Rare Power-Up Badge | **2x Score Multiplier + 40% Slow-Mo** for 6 seconds with romantic flute BGM! |
| **Karela Juice** (Vector art) | Hazard | **-1 Life** (Yuck! Bitter gourd!) |
| **Chappal** (`./photos/chapal.svg`) | Fast Hazard | **-1 Life** (Spawns at score &ge; 200 after a 0.6s red `!` warning) |
| **Sundarlal's Taxi Bill** (Vector art) | Hazard | **-30 pts** (₹5,000 Ahmedabad-to-Mumbai taxi receipt!) |

---

## ⚙️ Customization (`GAME_CONFIG`)

At the very top of `game.js`, you can easily edit the message shown on the 500-Point Notice Board:

```javascript
const GAME_CONFIG = {
  recipientName: "Archana",
  targetScore: 500,
  noticeTitle: "GOKULDHAM SOCIETY — SPECIAL NOTICE",
  suvichar: "Aaj ka Suvichar: Some people are even sweeter than Sunday morning Jalebi-Fafda.",
  personalMessage: "Archana, you bring more sweetness, warmth, and smiles into every single day than a fresh Sunday plate of crispy hot Jalebi-Fafda. Thank you for being so wonderfully special!",
  signedBy: "— Ekameva Secretary, Aatmaram Tukaram Bhide & All of Gokuldham"
};
```

---

## 🚀 Running Locally

You can run the game locally using Node.js with **zero external dependencies**:

```bash
node local-server.js
```

Then open [http://localhost:3000](http://localhost:3000) in your browser!

### Testing / Preview Shortcuts:
- **`Shift + W`**: Press anytime on desktop to preview the 500-point Gokuldham Notice Board modal.
- `?preview=1`: Appending `?preview=1` to the URL immediately displays the Notice Board.
- `?autostart=1`: Automatically starts the game on page load.
- `?gameover=1`: Previews the Game Over modal.

---

## 🚀 Deployment to Vercel & GitHub

This game is built with pure Vanilla HTML5, CSS3, and ES6 JavaScript with **zero build steps, zero external CDNs, and zero dependencies**.

1. **Commit & Push to GitHub:**
   ```bash
   git add .
   git commit -m "feat: Jalebi-Fafda Morning Rush web game"
   git remote add origin <your-github-repo-url>
   git push -u origin master
   ```

2. **Deploy on Vercel:**
   - Import the GitHub repository into [Vercel](https://vercel.com).
   - Keep default settings (Static Site, Root Directory `./`).
   - Click **Deploy**. Vercel will instantly host it live!
