# vPricer - Quick Start Guide

## 🚀 You're Almost Ready!

Your vPricer application is set up and ready to run. Follow these simple steps:

### Step 1: Get Your Anthropic API Key

1. Go to: https://console.anthropic.com
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### Step 2: Configure Your API Key

Edit the `.env` file and replace `sk-ant-your_key_here` with your actual API key:

```bash
ANTHROPIC_API_KEY=sk-ant-your_actual_key_here
```

### Step 3: Install Dependencies

```bash
cd vpricer
npm install
```

This will install:
- express (web server)
- cors (cross-origin support)
- node-fetch (API calls)
- dotenv (environment variables)

### Step 4: Start the Server

```bash
npm start
```

You should see:
```
vPricer backend running on port 3000
Frontend: http://localhost:3000
API: http://localhost:3000/api
```

### Step 5: Open in Browser

Visit: http://localhost:3000

---

## 📁 Your Project Structure

```
vpricer/
├── public/
│   └── index.html          # Frontend UI
├── server.js               # Backend API
├── package.json            # Dependencies
├── .env                    # Your API key (EDIT THIS!)
├── .env.example            # Template
└── QUICK_START.md          # This file
```

---

## 🎯 How to Use vPricer

1. **Find a vehicle listing** on any dealer website (e.g., CarMax, AutoTrader, dealer site)
2. **Copy the URL** of the vehicle listing
3. **Paste it** into vPricer
4. **Click "Compare"** to find the same vehicle at nearby dealers
5. **View results** with prices, savings, and navigation to dealers

---

## 🔧 Troubleshooting

### "API key not found" error
- Check that `.env` file exists
- Make sure `ANTHROPIC_API_KEY` is set correctly
- Restart the server after changing `.env`

### Port already in use
- Change PORT in `.env` to a different number (e.g., 3001)
- Or kill the existing process: `lsof -ti:3000 | xargs kill`

### Dependencies not installed
- Make sure you're in the correct directory: `vpricer`
- Run: `npm install`
- Check internet connection

---

## 💡 Example Usage

Try searching for a vehicle like:
```
https://www.example-dealer.com/2025-toyota-camry-se
```

vPricer will:
1. Extract vehicle details (Year, Make, Model, Trim)
2. Find real Toyota dealers within 100 miles
3. Search their inventories for exact matches
4. Show you price comparisons with savings

---

## 📊 Cost Estimate

- Each search costs approximately $0.05
- For 100 searches/month: ~$5
- For 1,000 searches/month: ~$50

Set billing alerts at https://console.anthropic.com

---

## 🚀 Next Steps

Once running:
1. Test with a real vehicle URL
2. Verify dealer discovery works
3. Check price comparisons are accurate
4. Share with friends to get feedback
5. Consider deploying to production (Railway, Heroku, etc.)

---

## ⚠️ Important Notes

- Keep your `.env` file secure (never commit to Git)
- Add `.env` to `.gitignore` if using version control
- The `.env` file contains your secret API key
- Never share your API key publicly

---

## 📞 Need Help?

Check the logs:
- Browser console: F12 → Console tab
- Server logs: Terminal where you ran `npm start`

API status: https://status.anthropic.com

---

**Ready to start? Edit your `.env` file with your API key, then run `npm start`!**
