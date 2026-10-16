# MindSpace_Mobile

Expo (SDK 57) app for MindSpace. It uses the same Django backend and the same
Supabase database as the website, through the API added in update v10.

## Run it

1. Start Django so your phone can reach it (same Wi-Fi as your computer):

       cd ~/Downloads/mindspace_django/mindspace_backend
       python manage.py runserver 0.0.0.0:8000

2. In a second terminal:

       cd ~/Downloads/MindSpace_Mobile
       npm install
       npx expo start

3. Open Expo Go on your phone and scan the QR code.

The app finds Django automatically on the computer running `npx expo start`.
To point it somewhere else, copy `.env.example` to `.env` and set
`EXPO_PUBLIC_API_URL`.

## Screens

Welcome, Log in, Sign up (3 steps), Forgot password, Today (check-in, 7-day
chart, breakdown, streak), Chat (AI companion, photos, mood suggestions,
crisis banner, history), Insights (7/14/30 days, PDF report), Weekly insights,
Account (country, weekly email, daily reminder, export, delete, log out),
and Get help now (available on every screen, even when logged out).

## Related repository

The Django backend (API) for MindSpace lives here: [MindSpace_Backend](https://github.com/TinahMak/MindSpace_Backend)
