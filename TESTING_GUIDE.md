# Testing Guide - Civic Saathi

## System Status ✅

All three applications are running and ready for testing:

| Application | Status | URL/Access | PID |
|------------|--------|------------|-----|
| Backend API | ✅ Running | http://localhost:8080 | 25576 |
| Web Dashboard | ✅ Running | http://localhost:5173 | 20628 |
| Mobile App | ✅ Running | Scan QR code in Expo terminal | 27956 |

## Quick Start Testing

### 1. Test Backend API (Already Verified ✅)

The backend has been tested and is working correctly:

```bash
# Signup endpoint - TESTED ✅
POST http://localhost:8080/api/v1/auth/signup
Response: User created with UUID: f9b49f21-a6bc-4d4e-9ebf-6d3b455f53d1

# Login endpoint - TESTED ✅
POST http://localhost:8080/api/v1/auth/login
Response: Authentication successful with access token
```

### 2. Test Web Dashboard

**URL**: http://localhost:5173

#### Test Signup Flow
1. Open http://localhost:5173 in your browser
2. Click on the **"Create Account"** tab
3. Fill in the signup form:
   - **Name**: Your Name
   - **Email**: your.email@example.com
   - **Phone**: 9876543210
   - **Password**: password123
   - **Role**: Select from dropdown (Citizen/Worker/Admin)
   - **City**: Your City
4. Click **"Sign Up"** button
5. You should be redirected to the dashboard

#### Test Login Flow
1. If you already have an account, click **"Login"** tab
2. Enter your credentials:
   - **Email**: your.email@example.com
   - **Password**: password123
3. Click **"Login"** button
4. You should be redirected to the dashboard

#### Test Dashboard Features
Once logged in, test these features:
- **Dashboard**: View analytics and charts
- **Complaints**: View and filter complaints
- **Assignments**: View task assignments with SLA tracking
- **Departments**: Manage government departments
- **Workers**: Manage field workers
- **Users**: View all users
- **Notifications**: Check notification system

### 3. Test Mobile App

**Access**: Open Expo Go app on your phone and scan the QR code from the terminal

#### Test Signup Flow

**For Citizen:**
1. Open the app
2. Tap **"Create Account"**
3. Select **"Citizen"** role
4. Fill in the form:
   - Name
   - Email
   - Phone
   - Password
   - City (optional)
5. Tap **"Sign Up"**
6. You should see the citizen home screen

**For Worker:**
1. Open the app
2. Tap **"Create Account"**
3. Select **"Worker"** role
4. Fill in the form:
   - Name
   - Email
   - Phone
   - Password
   - Designation (e.g., "Sanitation Worker")
   - Department Code (e.g., "DEPT001")
5. Tap **"Sign Up"**
6. You should see the worker home screen

**For Admin:**
1. Open the app
2. Tap **"Create Account"**
3. Select **"Admin"** role
4. Fill in the form:
   - Name
   - Email
   - Phone
   - Password
   - City
   - Admin Code (e.g., "ADMIN001")
5. Tap **"Sign Up"**
6. You should be redirected to web dashboard

#### Test Login Flow
1. Open the app
2. Enter your credentials:
   - Email
   - Password
3. Tap **"Login"**
4. You should see the appropriate home screen based on your role

#### Test Mobile Features

**Citizen Features:**
- Report new complaints
- View your complaints
- Track complaint status
- View complaint details
- Update profile

**Worker Features:**
- View assigned tasks
- Accept assignments
- Mark tasks as complete
- View task details
- Update profile

## Testing Checklist

### Backend API ✅
- [x] Signup endpoint working
- [x] Login endpoint working
- [x] UUID migration complete
- [x] All tests passing (7/7)
- [x] Database schema correct

### Web Dashboard
- [ ] Signup flow works
- [ ] Login flow works
- [ ] Session persistence works
- [ ] Dashboard loads correctly
- [ ] Complaints page works
- [ ] Assignments page works
- [ ] Departments page works
- [ ] Workers page works
- [ ] Users page works
- [ ] Notifications work
- [ ] Logout works

### Mobile App
- [ ] Citizen signup works
- [ ] Worker signup works
- [ ] Admin signup works (redirects to web)
- [ ] Login works for all roles
- [ ] Citizen home screen loads
- [ ] Worker home screen loads
- [ ] Report complaint works (Citizen)
- [ ] View assignments works (Worker)
- [ ] Navigation works
- [ ] Logout works

## Test User Accounts

You can create test accounts with these details:

### Citizen Account
```
Name: Test Citizen
Email: citizen@test.com
Phone: 9999999991
Password: password123
Role: CITIZEN
City: Mumbai
```

### Worker Account
```
Name: Test Worker
Email: worker@test.com
Phone: 9999999992
Password: password123
Role: WORKER
Designation: Sanitation Worker
Department Code: DEPT001
```

### Admin Account
```
Name: Test Admin
Email: admin@test.com
Phone: 9999999993
Password: password123
Role: ADMIN
City: Mumbai
Admin Code: ADMIN001
```

## API Endpoints Reference

### Authentication
- `POST /api/v1/auth/signup` - Create new account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Complaints
- `GET /api/v1/complaints` - List complaints
- `POST /api/v1/complaints` - Create complaint
- `GET /api/v1/complaints/{id}` - Get complaint by ID
- `PUT /api/v1/complaints/{id}` - Update complaint
- `DELETE /api/v1/complaints/{id}` - Delete complaint

### Departments
- `GET /api/v1/departments` - List departments
- `POST /api/v1/departments` - Create department
- `GET /api/v1/departments/{id}` - Get department by ID
- `PUT /api/v1/departments/{id}` - Update department
- `DELETE /api/v1/departments/{id}` - Delete department

### Workers
- `GET /api/v1/workers` - List workers
- `POST /api/v1/workers` - Create worker
- `GET /api/v1/workers/{id}` - Get worker by ID
- `PUT /api/v1/workers/{id}` - Update worker
- `DELETE /api/v1/workers/{id}` - Delete worker

### Assignments
- `GET /api/v1/assignments` - List assignments
- `POST /api/v1/assignments` - Create assignment
- `GET /api/v1/assignments/{id}` - Get assignment by ID
- `PUT /api/v1/assignments/{id}` - Update assignment
- `DELETE /api/v1/assignments/{id}` - Delete assignment

### Notifications
- `GET /api/v1/notifications` - List notifications
- `POST /api/v1/notifications` - Create notification
- `GET /api/v1/notifications/{id}` - Get notification by ID
- `PUT /api/v1/notifications/{id}/read` - Mark as read
- `DELETE /api/v1/notifications/{id}` - Delete notification

## Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
netstat -ano | findstr :8080
taskkill /F /PID <PID>
cd backend
.\mvnw.cmd spring-boot:run
```

**Database connection error:**
- Check PostgreSQL is running
- Verify credentials in `.env` file
- Ensure `Civic` database exists

### Web Dashboard Issues

**Port 5173 already in use:**
```bash
netstat -ano | findstr :5173
taskkill /F /PID <PID>
cd web-dashboard
npm run dev
```

**API connection error:**
- Check backend is running on port 8080
- Verify `VITE_API_BASE_URL` in `.env` file

### Mobile App Issues

**Expo server won't start:**
```bash
cd mobile-app
npm run start
```

**Can't connect to API:**
- Check backend is running
- Verify `EXPO_PUBLIC_API_BASE_URL` in `mobile-app/.env`
- Make sure your phone and computer are on the same network

**QR code not scanning:**
- Use Expo Go app (not camera app)
- Make sure QR code is fully visible
- Try manual connection with the URL shown in terminal

## Environment Variables

### Backend (.env)
```env
DB_URL=jdbc:postgresql://localhost:5432/Civic
DB_USERNAME=postgres
DB_PASSWORD=root
JWT_SECRET=your-secret-key-min-32-characters-long
```

### Web Dashboard (.env)
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Mobile App (.env)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

## Next Steps After Testing

Once you've verified everything works:

1. **Report any issues** you find during testing
2. **Proceed with feature development**:
   - Dark/light mode toggle for web dashboard
   - Real-time notifications via WebSocket
   - AI-powered issue classification
   - File upload for complaint evidence
3. **Deploy to staging/production** when ready

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the logs in the terminal windows
3. Check `SYSTEM_STATUS.md` for current system status
4. Review `UUID_MIGRATION_COMPLETE.md` for migration details

---

**Testing Guide Created**: May 10, 2026, 08:50 AM
**System Status**: All systems operational ✅
**Ready for Testing**: Yes ✅
