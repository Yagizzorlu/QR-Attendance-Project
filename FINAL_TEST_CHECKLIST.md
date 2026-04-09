# Final Test Checklist

## 1. Auth

- [] Login works
- [ ] Invalid credentials shows error
- [ ] Protected `/admin` redirects to `/login`
- [ ] Logout clears session

## 2. Event Management

- [ ] Create event works
- [ ] Event appears in list
- [ ] Event detail page opens
- [ ] Live QR page opens

## 3. Check-in Flow

- [ ] QR validate works with valid QR
- [ ] Expired QR fails
- [ ] Out-of-range GPS fails
- [ ] Registered participant completes attendance
- [ ] Walk-in participant registers and completes attendance
- [ ] Duplicate attendance fails

## 4. Admin Operations

- [ ] Attendance page shows records
- [ ] Participants page shows records
- [ ] Manual present/absent works
- [ ] CSV import works
- [ ] Excel export downloads file

## 5. Polish / UX

- [ ] Loading states visible
- [ ] Error states readable
- [ ] No broken links
- [ ] No console/server errors in normal flow
