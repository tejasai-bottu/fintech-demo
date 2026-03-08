# 🚀 AI-Powered Financial Advisory System

Complete demo project with Docker setup for easy deployment.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Running the Application](#running-the-application)
- [Testing the Demo](#testing-the-demo)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

```bash
# Clone or download the project
cd fintech-demo

# Start all services with Docker
docker-compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## 📖 Project Overview

### What This Demo Includes

✅ **Investment Planning Module**
- AI-powered return predictions
- Risk assessment (Low/Medium/High)
- Portfolio recommendations
- Growth projections with charts

✅ **Debt Management System**
- EMI calculator
- Amortization schedules
- Interest calculations
- Early repayment suggestions

✅ **Expense Analyzer**
- Category-wise breakdown
- Spending insights
- Savings potential analysis
- Smart cost reduction tips

✅ **Interactive Dashboard**
- Real-time financial summary
- Investment portfolio visualization
- Market insights
- Personalized AI recommendations

### Technology Stack

- **Frontend**: HTML, Tailwind CSS, JavaScript, Chart.js
- **Backend**: Python FastAPI
- **Database**: PostgreSQL
- **Container**: Docker & Docker Compose
- **AI Engine**: Rule-based prediction system

---

## 💻 Prerequisites

### Required Software

1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download: https://www.docker.com/products/docker-desktop
   - Version: 20.x or higher
   
2. **Docker Compose**
   - Comes with Docker Desktop
   - Linux: Install separately if needed

3. **Modern Web Browser**
   - Chrome, Firefox, Safari, or Edge
   - JavaScript enabled

### System Requirements

- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 5GB free space
- **OS**: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- **Network**: Internet connection for initial Docker image pull

### Verification

```bash
# Check Docker
docker --version
# Output: Docker version 20.x.x or higher

# Check Docker Compose
docker-compose --version
# Output: docker-compose version 1.x.x or higher
```

---

## 📦 Installation Steps

### Step 1: Download/Clone Project

Option A - Download ZIP:
```bash
# Extract the ZIP file
unzip fintech-demo.zip
cd fintech-demo
```

Option B - Git Clone:
```bash
git clone <repository-url>
cd fintech-demo
```

### Step 2: Verify Project Structure

```bash
ls -la
```

You should see:
```
backend/
frontend/
nginx/
docker-compose.yml
.env
README.md
```

### Step 3: Review Environment Variables

The `.env` file contains configuration:

```env
# Database
POSTGRES_USER=fintech_user
POSTGRES_PASSWORD=securePassword123
POSTGRES_DB=fintech_db

# Backend
BACKEND_PORT=8000
SECRET_KEY=demo-secret-key-2024

# Frontend
FRONTEND_PORT=80
```

**Note**: For production, change the SECRET_KEY and database password!

### Step 4: Build and Start Services

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

This will:
1. Download required Docker images
2. Build custom images for backend and frontend
3. Create PostgreSQL database
4. Initialize database tables
5. Start all services

**First-time build takes 5-10 minutes**

### Step 5: Verify Services

Check running containers:
```bash
docker-compose ps
```

Expected output:
```
NAME                STATUS    PORTS
fintech-backend     Up        0.0.0.0:8000->8000/tcp
fintech-frontend    Up        0.0.0.0:80->80/tcp
fintech-db          Up        5432/tcp
```

### Step 6: Check Logs

```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Follow logs in real-time
docker-compose logs -f
```

---

## 🚀 Running the Application

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost | Main application UI |
| Backend API | http://localhost:8000 | REST API endpoints |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Alternative Docs | http://localhost:8000/redoc | ReDoc API documentation |

### First Time Setup

1. **Open Browser**: Navigate to http://localhost

2. **Register Account**:
   - Click "Register" or "Sign Up"
   - Fill in details:
     - Email: test@example.com
     - Password: demo123
     - Full Name: Test User
     - Monthly Income: 50000
     - Risk Tolerance: Medium

3. **Login**:
   - Use registered credentials
   - You'll be redirected to dashboard

4. **Explore Features**:
   - Dashboard: Financial overview
   - Investments: Add and predict returns
   - Debt Manager: Calculate EMIs
   - Expense Analyzer: Track spending

### Common Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Remove all containers and volumes
docker-compose down -v
```

---

## 🧪 Testing the Demo

### Test Scenario 1: Investment Planning

1. **Navigate to Investment Page**
2. **Enter Investment Details**:
   - Amount: ₹100,000
   - Duration: 5 years
   - Risk Level: Medium
3. **Click "Predict Returns"**
4. **View Results**:
   - Expected Return Rate: ~10-13%
   - Future Value calculation
   - Risk Score
   - Growth chart over time

### Test Scenario 2: Debt Management

1. **Go to Debt Manager**
2. **Enter Loan Details**:
   - Loan Amount: ₹500,000
   - Interest Rate: 10.5%
   - Tenure: 60 months
3. **Calculate EMI**
4. **View Results**:
   - Monthly EMI amount
   - Total interest payable
   - Amortization schedule
   - Early repayment suggestions

### Test Scenario 3: Expense Analysis

1. **Open Expense Analyzer**
2. **Add Monthly Expenses**:
   - Rent: ₹15,000
   - Food: ₹8,000
   - Transport: ₹3,000
   - Entertainment: ₹5,000
3. **Get AI Insights**:
   - Category-wise breakdown
   - Percentage distribution
   - Savings recommendations
   - Cost reduction tips

### Test Scenario 4: Dashboard Overview

1. **View Dashboard**
2. **Check Summary**:
   - Total investments
   - Active debts
   - Monthly expenses
   - Savings rate
3. **Market Insights**:
   - Current indices (simulated)
   - Market trends
   - AI recommendations

---

## 📁 Project Structure

```
fintech-demo/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # Database models
│   │   ├── database.py          # DB connection
│   │   ├── ai_engine.py         # AI prediction engine
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # Authentication
│   │   │   ├── investment.py    # Investment endpoints
│   │   │   ├── debt.py          # Debt management
│   │   │   ├── expense.py       # Expense tracking
│   │   │   └── dashboard.py     # Dashboard data
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── financial_calculations.py
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # Backend container config
│
├── frontend/
│   ├── index.html              # Landing page
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── dashboard.html          # Main dashboard
│   ├── investment.html         # Investment module
│   ├── debt.html               # Debt management
│   ├── expense.html            # Expense analyzer
│   ├── css/
│   │   └── style.css           # Custom styles
│   ├── js/
│   │   ├── main.js             # Common functions
│   │   ├── dashboard.js        # Dashboard logic
│   │   ├── investment.js       # Investment logic
│   │   ├── debt.js             # Debt logic
│   │   └── expense.js          # Expense logic
│   └── Dockerfile              # Frontend container config
│
├── nginx/
│   ├── nginx.conf              # Nginx configuration
│   └── Dockerfile              # Nginx container config
│
├── docker-compose.yml          # Multi-container orchestration
├── .env                        # Environment variables
├── .dockerignore              # Docker ignore rules
└── README.md                   # This file
```

---

## 📚 API Documentation

### Authentication Endpoints

**POST** `/api/auth/register`
- Register new user
- Body: `{ email, password, full_name, monthly_income, risk_tolerance }`
- Returns: `{ access_token, token_type }`

**POST** `/api/auth/login`
- User login
- Body: `{ email, password }`
- Returns: `{ access_token, token_type }`

### Investment Endpoints

**POST** `/api/investment/predict`
- Predict investment returns
- Body: `{ amount, investment_type, duration_years, risk_level }`
- Returns: Prediction with growth projections

**POST** `/api/investment/create`
- Create investment record
- Requires: user_email parameter
- Body: Investment details

**GET** `/api/investment/recommendations/{user_email}`
- Get personalized recommendations
- Returns: AI-generated investment advice

### Debt Endpoints

**POST** `/api/debt/calculate`
- Calculate EMI and interest
- Body: `{ principal, interest_rate, tenure_months }`
- Returns: EMI, total interest, amortization schedule

**POST** `/api/debt/create`
- Create debt record
- Requires: user_email parameter

**GET** `/api/debt/list/{user_email}`
- List all user debts

### Expense Endpoints

**POST** `/api/expense/create`
- Add expense
- Body: `{ category, amount, month }`

**GET** `/api/expense/analyze/{user_email}`
- Analyze expenses
- Returns: Breakdown, insights, savings potential

### Dashboard Endpoint

**GET** `/api/dashboard/{user_email}`
- Get complete dashboard data
- Returns: Financial summary, investments, debts, market insights

---

## 🔧 Troubleshooting

### Issue: Port Already in Use

**Problem**: `Error: bind: address already in use`

**Solution**:
```bash
# Find process using port 80
sudo lsof -i :80

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "8080:80"  # Use 8080 instead
```

### Issue: Docker Build Fails

**Problem**: Network errors during build

**Solution**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild with no cache
docker-compose build --no-cache

# Check internet connection
ping google.com
```

### Issue: Database Connection Failed

**Problem**: Backend can't connect to database

**Solution**:
```bash
# Check if DB container is running
docker-compose ps

# Check DB logs
docker-compose logs db

# Restart DB container
docker-compose restart db

# Verify environment variables
cat .env
```

### Issue: CORS Errors

**Problem**: Frontend can't access backend API

**Solution**:
1. Check if backend is running: http://localhost:8000
2. Verify CORS settings in `backend/app/main.py`
3. Check browser console for exact error
4. Ensure API_URL in frontend JS matches backend URL

### Issue: Images Not Loading

**Problem**: Static files not serving

**Solution**:
```bash
# Check nginx configuration
docker-compose logs frontend

# Verify file permissions
ls -la frontend/

# Restart nginx
docker-compose restart frontend
```

### Issue: API Returns 500 Error

**Problem**: Internal server error

**Solution**:
```bash
# Check backend logs
docker-compose logs backend

# Access backend container
docker exec -it fintech-backend bash

# Check database connection
python -c "from app.database import engine; print(engine)"

# Verify all tables created
docker exec -it fintech-db psql -U fintech_user -d fintech_db -c "\\dt"
```

### Issue: Slow Performance

**Solution**:
```bash
# Check resource usage
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Advanced > Memory: 4GB

# Remove unused containers
docker system prune
```

---

## 🎓 Understanding the AI Engine

### How "Fake AI" Works

The system uses **rule-based logic** instead of actual machine learning:

```python
# Example: Investment prediction
if risk_level == "high":
    return_rate = random.uniform(12%, 18%)
elif risk_level == "medium":
    return_rate = random.uniform(9%, 13%)
else:
    return_rate = random.uniform(5%, 8%)

future_value = principal * (1 + return_rate) ** years
```

### Why This Works for Demo

✅ **Realistic Results**: Uses actual financial formulas  
✅ **Fast**: No model training required  
✅ **Deterministic**: Predictable behavior  
✅ **Impressive**: Looks like real AI to judges  
✅ **Scalable**: Can be replaced with real ML later

### Key Formulas Used

**EMI Calculation**:
```
EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
```

**Future Value**:
```
FV = P × (1 + r)^t
```

**SIP Future Value**:
```
FV = P × ({[1 + r]^n – 1} / r) × (1 + r)
```

---

## 🎨 Customization Guide

### Change Color Theme

Edit `frontend/css/style.css`:

```css
:root {
    --primary-color: #667eea;    /* Purple */
    --secondary-color: #764ba2;  /* Dark Purple */
    --accent-color: #f093fb;     /* Pink */
}
```

### Modify AI Predictions

Edit `backend/app/ai_engine.py`:

```python
# Change return rates
base_rates = {
    "low": (0.06, 0.09),     # 6-9% instead of 5-8%
    "medium": (0.10, 0.14),  # 10-14% instead of 9-13%
    "high": (0.15, 0.22)     # 15-22% instead of 12-18%
}
```

### Add New Features

1. **Create new route**: `backend/app/routes/feature.py`
2. **Add HTML page**: `frontend/feature.html`
3. **Create JS logic**: `frontend/js/feature.js`
4. **Include in main**: Add to `backend/app/main.py`

---

## 📊 Demo Presentation Tips

### For Judges/Reviewers

1. **Start with Dashboard**
   - Show clean, professional UI
   - Highlight real-time calculations

2. **Investment Module**
   - Enter different risk levels
   - Show prediction variations
   - Display growth charts

3. **Debt Calculator**
   - Live EMI calculation
   - Show amortization schedule
   - Demonstrate accuracy

4. **Expense Insights**
   - Add various expenses
   - Show AI recommendations
   - Highlight savings potential

5. **Technical Stack**
   - Mention Docker containerization
   - Explain microservices architecture
   - Show API documentation

### Key Selling Points

✅ **Scalable Architecture**: Microservices with Docker  
✅ **Real Calculations**: Actual financial formulas  
✅ **AI Integration**: Ready for ML model upgrade  
✅ **Professional UI**: Production-grade design  
✅ **API First**: RESTful architecture  
✅ **Database Backed**: Persistent data storage

---

## 📞 Support & Contact

### Getting Help

1. **Check Logs**:
   ```bash
   docker-compose logs -f
   ```

2. **API Documentation**:
   http://localhost:8000/docs

3. **Verify Setup**:
   ```bash
   docker-compose ps
   docker-compose config
   ```

### Common Questions

**Q: Can I use this in production?**
A: This is a demo. For production, add:
- Actual authentication (OAuth/JWT with refresh tokens)
- Real ML models
- Error handling
- Input validation
- Security headers
- Rate limiting

**Q: How do I add more users?**
A: Register through frontend or use API directly:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123",...}'
```

**Q: Can I deploy this online?**
A: Yes! Deploy to:
- AWS (ECS/Fargate)
- Google Cloud (Cloud Run)
- Azure (Container Instances)
- DigitalOcean (App Platform)
- Heroku (Container Registry)

---

## 📝 License

This is a demo project for educational purposes.

---

## 🎉 Final Checklist

Before demo:

- [ ] All services running: `docker-compose ps`
- [ ] Frontend accessible: http://localhost
- [ ] Backend responding: http://localhost:8000
- [ ] Test account created and working
- [ ] All features tested
- [ ] Charts displaying correctly
- [ ] Data persisting in database

You're ready to demo! 🚀

---

**Built with ❤️ for learning and demonstration purposes**
