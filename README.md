# AdaptiveChat — Real-Time Smart Messaging API

> A resilient real-time messaging backend built for unstable network environments — designed with offline-first architecture, intelligent message prioritization, and security-first principles.

**Current Status**: ✅ Backend Complete | 🚧 Frontend In Progress

---

## 📋 Project Overview

In Rwanda and across much of Africa, unstable internet connectivity is a daily reality. Traditional chat applications silently fail under these conditions — messages get lost, delivery is unpredictable, and users have no control over what gets through first.

**AdaptiveChat** solves this by building resilience directly into the messaging layer:

- Messages are **prioritized** so urgent communication always gets through first
- An **offline-first architecture** queues and syncs messages automatically when connectivity is restored
- The entire system is built with **security at every layer** — not added as an afterthought

This project is not just a chat app. It is an infrastructure decision for low-connectivity environments.

---

## 🔐 Security Architecture

Security was a core design requirement, not a feature added later.

| Layer | Implementation | Why It Matters |
|---|---|---|
| Authentication | JWT with 7-day expiration + bcrypt password hashing | Passwords never stored in plain text; tokens expire automatically |
| Transport | Helmet.js HTTP headers | Protects against XSS, clickjacking, and common HTTP attacks |
| Access Control | CORS policy + protected route middleware | Prevents unauthorized cross-origin requests |
| Abuse Prevention | Rate limiting on all auth endpoints | Blocks brute force attacks on login and registration |
| Authorization | Role-based access (user/admin) | Enforces least-privilege principle |

---

## ✅ Phase 1 Complete — Backend Core

### Authentication System
- User registration with bcrypt password hashing (salt rounds: 10)
- JWT-based login with 7-day token expiration
- Protected route middleware for all authenticated endpoints
- Profile management (GET/PUT)

### Real-Time Chat System
- One-on-one and group chat creation
- Real-time messaging via Socket.IO with room-based architecture
- **Message priority system** — Normal / Important / Urgent
- Message status tracking — sent → delivered → read
- Typing indicators and read receipts
- Paginated message history for performance

### API Documentation
- Interactive Swagger UI available at `/api-docs`
- Full endpoint documentation with request/response schemas
- JWT authentication integrated into Swagger interface
- Live testable without any additional tooling

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Runtime | Node.js v18+ | Server environment |
| Framework | Express.js | API routing and middleware |
| Database | MongoDB + Mongoose | Persistent storage with schema validation |
| Authentication | JWT + bcrypt | Secure stateless auth |
| Real-time | Socket.IO | WebSocket communication |
| Documentation | Swagger UI | Interactive API docs |
| Security | Helmet, CORS, Rate Limiting | HTTP hardening and abuse prevention |

---

## 📡 API Endpoints

| Resource | Method | Endpoint | Auth Required |
|---|---|---|---|
| Auth | POST | `/api/register` | No |
| Auth | POST | `/api/login` | No |
| Auth | POST | `/api/logout` | Yes |
| Profile | GET/PUT | `/api/profile` | Yes |
| Chats | POST | `/api/chats` | Yes |
| Chats | GET | `/api/chats` | Yes |
| Chats | GET | `/api/chats/:id` | Yes |
| Messages | POST | `/api/messages/:chatId` | Yes |
| Messages | GET | `/api/messages/:chatId` | Yes |
| Messages | PUT | `/api/messages/:id/status` | Yes |

Full interactive documentation available at `/api-docs` when running locally.

---

## 🗄️ Database Schema

### User
```js
{
  username: String,
  email: String,
  password: String,       // bcrypt hashed — never stored plain text
  role: String,           // "user" | "admin"
  profilePicture: String,
  createdAt: Date
}
```

### Chat
```js
{
  name: String,
  isGroup: Boolean,
  participants: [ObjectId → User],
  lastMessage: ObjectId → Message,
  admin: ObjectId → User,
  createdAt: Date
}
```

### Message
```js
{
  chat: ObjectId → Chat,
  sender: ObjectId → User,
  content: String,
  priority: String,       // "normal" | "important" | "urgent"
  status: String,         // "sent" | "delivered" | "read"
  offlineId: String,      // client-generated ID for offline sync
  deliveredAt: Date,
  readAt: Date,
  createdAt: Date
}
```

---

## 🚧 Phase 2 — Frontend Development

### Week 1 — Core UI
- [ ] React 19 + TypeScript setup with Vite
- [ ] Tailwind CSS v4 configuration
- [ ] Login/Register pages with form validation
- [ ] Authentication context and protected routes

### Week 2 — Chat Interface
- [ ] Chat list sidebar with last message preview
- [ ] Chat window with message bubbles
- [ ] Real-time updates via Socket.IO client
- [ ] Typing indicators and read receipt UI
- [ ] Message priority badges (Normal / Important / Urgent)

### Week 3 — Features and Polish
- [ ] User profile management
- [ ] Group chat creation
- [ ] Online/offline status indicators
- [ ] Responsive mobile design
- [ ] Loading states and error handling

### Frontend Tech Stack
| Component | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM |
| HTTP Client | Axios |
| Real-time | Socket.IO-client |
| State Management | Context API |

### Planned Frontend Architecture
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level pages
│   ├── context/        # React Context (auth, socket)
│   ├── services/       # API calls and Socket.IO logic
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Helper functions
│   ├── App.tsx
│   └── main.tsx
├── index.html
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- npm or yarn

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/Umwizer/Real-Time-Smart-Messaging-App.git
cd Real-Time-Smart-Messaging-App/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Open .env and fill in your MongoDB URI and JWT secret

# Start development server
npm run dev
```

### Access Points
| Service | URL |
|---|---|
| REST API | `http://localhost:5000/api` |
| Swagger Docs | `http://localhost:5000/api-docs` |
| WebSocket | `ws://localhost:5000` |

### Environment Variables
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret_here
CORS_ORIGIN=http://localhost:3000
```

> ⚠️ Never commit your `.env` file. It is included in `.gitignore`.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

---

## 💡 Design Decisions

**Why offline-first?**
In environments with unreliable connectivity, a system that simply fails is not acceptable. The `offlineId` field on each message allows the client to generate a temporary ID, queue the message locally, and reconcile with the server once connection is restored — without duplicating messages.

**Why message priority?**
Not all messages are equal. A system that treats "hello" and "URGENT: server is down" identically is poorly designed. Priority levels allow clients to surface critical messages immediately, even when bandwidth is constrained.

**Why Swagger documentation?**
A backend that cannot be understood or tested without reading source code is incomplete. Swagger makes the API self-documenting and testable by anyone — including future collaborators and reviewers.

---

## 👩🏽‍💻 Author

**Umwizerwa Ruth**
Software Engineering Student — Faculty of Information Technology, Kigali, Rwanda

- GitHub: [@Umwizer](https://github.com/Umwizer)
- LinkedIn: [umwizerwa-ruth](https://www.linkedin.com/in/umwizerwa-ruth-292aa92b6/)
- Email: ruthumwizerwa@gmail.com

---

## 📄 License

MIT License — feel free to use, learn from, and build on this project.
