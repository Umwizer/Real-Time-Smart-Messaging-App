
# AdaptiveChat Backend: Real-Time Smart Messaging API

A resilient real-time messaging API with smart message handling, offline synchronization, and conversation intelligence.

**Current Status**: Backend Complete |  Next: Frontend Development

---

## 📋 Project Overview

AdaptiveChat addresses communication challenges in unstable network environments by implementing intelligent message handling and offline-first architecture. The backend provides a robust API for real-time messaging with smart features.

### The Problem
Traditional chat applications fail in poor network conditions, lack message prioritization, and offer no conversation intelligence.

### The Solution
- **Smart message prioritization** (Normal/Important/Urgent)
- **Offline-first architecture** with automatic sync
- **Real-time messaging** with Socket.IO
- **Reliable delivery** under challenging conditions

---

## Completed: Backend Core (Phase 1)

### Features Implemented

#### Authentication System
- User registration with bcrypt password hashing
- JWT-based login with 7-day token expiration
- Protected routes with auth middleware
- Profile management (GET/PUT)

#### Chat System
- One-on-one and group chat creation
- Real-time messaging with Socket.IO
- Message priority system (normal/important/urgent)
- Message status tracking (sent/delivered/read)
- Typing indicators & read receipts
- Paginated message history

#### API Documentation
- Interactive Swagger UI at `/api-docs`
- Complete endpoint documentation with examples
- JWT authentication integration
- Request/response schemas

### Tech Stack
| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Real-time | Socket.IO |
| Docs | Swagger UI |
| Security | Helmet, CORS, Rate Limiting |

### API Endpoints
| Resource | Endpoints |
|----------|-----------|
| Auth | POST `/register`, `/login`, `/logout`<br>GET/PUT `/profile` |
| Chats | POST `/chats`<br>GET `/chats`<br>GET `/chats/:id` |
| Messages | POST `/messages/:chatId`<br>GET `/messages/:chatId`<br>PUT `/messages/:id/status` |

---

## 🚧 Next Phase: Frontend Development

### Phase 2 Goals

#### Core UI (Week 1)
- [ ] React + TypeScript setup with Vite
- [ ] Tailwind CSS configuration
- [ ] Login/Register pages with form validation
- [ ] Authentication context & protected routes

#### Chat Interface (Week 2)
- [ ] Chat list sidebar with last message preview
- [ ] Chat window with message bubbles
- [ ] Real-time message updates with Socket.IO
- [ ] Typing indicators & read receipts UI
- [ ] Message priority badges (normal/important/urgent)

#### Features & Polish (Week 3)
- [ ] User profile management
- [ ] Group chat creation
- [ ] Online/offline status indicators
- [ ] Responsive mobile design
- [ ] Loading states & error handling

### Frontend Tech Stack
| Component | Technology |
|-----------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM |
| API Calls | Axios |
| Real-time | Socket.IO-client |
| State | Context API |

### Planned Architecture
```
frontend/
├── src/
│   ├── components/     # Reusable UI
│   ├── pages/         # Route pages
│   ├── context/       # React Context
│   ├── services/      # API & Socket
│   ├── types/         # TypeScript types
│   ├── utils/         # Helpers
│   ├── App.tsx
│   └── main.tsx
├── index.html
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
# Clone repository
git clone <your-repo>
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start server
npm run dev
```

### Access Points
- **API**: `http://localhost:5000/api`
- **Swagger Docs**: `http://localhost:5000/api-docs`
- **WebSocket**: `ws://localhost:5000`

### Environment Variables
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

---

## Database Schema

### User
```js
{
  username: String,
  email: String,
  password: String (hashed),
  role: String (user/admin),
  profilePicture: String
}
```

### Chat
```js
{
  name: String,
  isGroup: Boolean,
  participants: [ObjectId(User)],
  lastMessage: ObjectId(Message),
  admin: ObjectId(User)
}
```

### Message
```js
{
  chat: ObjectId(Chat),
  sender: ObjectId(User),
  content: String,
  priority: String (normal/important/urgent),
  status: String (sent/delivered/read),
  offlineId: String,
  deliveredAt: Date,
  readAt: Date
}
```

---

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```


## Author

**Your Name**
- GitHub: [Umwizer](https://github.com/Umwizer)
- Email: ruthumwizerwa@gmail.com
