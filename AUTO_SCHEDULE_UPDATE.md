# Updated Exam Control Features - Auto-Schedule Support

## What Changed

Based on your feedback, I've enhanced the exam control system to support **automatic scheduled starts** in addition to manual control.

## Current Behavior (Enhanced)

### 1. Scheduled Start (Automatic)
- **User Action**: When creating a drive, company fills in:
  - `scheduled_start`: Date/time when exam should start
  - `duration_minutes`: How long the exam should run
  
- **System Behavior**: 
  - Exam automatically starts at `scheduled_start` time
  - System checks every 30 seconds (via polling)
  - When `scheduled_start` time arrives, `actual_start` is set automatically
  - Status changes to "ongoing"
  - Students can begin taking the exam

### 2. Manual Start (Override)
- Company can manually start the exam **before** the scheduled time
- Click "Start Exam Now" button
- Exam starts immediately regardless of `scheduled_start`

### 3. Auto-End (Based on Duration)
- After exam starts (either way), it runs for `duration_minutes`
- System automatically ends when: `current_time - actual_start >= duration_minutes`
- Sets `actual_end` and changes status to "completed"

### 4. Manual End (Emergency Override)
- Company can manually end exam anytime during the exam
- Click "End Exam Manually" button
- Exam ends immediately

## Complete Flow Diagram

```
USER CREATES DRIVE
├── Title: "Python Coding Test"
├── scheduled_start: "2025-12-26 10:00:00"
└── duration_minutes: 60
         ↓
ADMIN APPROVES DRIVE
         ↓
COMPANY SENDS EMAILS TO STUDENTS
         ↓
┌────────────────────────────────────────┐
│ EXAM START (Two Ways)                  │
├────────────────────────────────────────┤
│                                        │
│  OPTION A: Scheduled Auto-Start       │
│  ├── Clock reaches scheduled_start    │
│  ├── System detects (30s polling)     │
│  ├── Sets actual_start = current_time │
│  └── Status = "ongoing"               │
│                                        │
│  OPTION B: Manual Start               │
│  ├── Company clicks "Start Now"       │
│  ├── Sets actual_start = current_time │
│  └── Status = "ongoing"               │
│                                        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ EXAM RUNNING                           │
├────────────────────────────────────────┤
│ Duration: 60 minutes                   │
│ Timer counting down                    │
│ Students taking exam                   │
│ System checking every 30s              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ EXAM END (Two Ways)                    │
├────────────────────────────────────────┤
│                                        │
│  OPTION A: Auto-End (Duration)        │
│  ├── 60 minutes elapsed               │
│  ├── System detects                   │
│  ├── Sets actual_end = current_time   │
│  └── Status = "completed"             │
│                                        │
│  OPTION B: Manual End                 │
│  ├── Company clicks "End Manually"    │
│  ├── Sets actual_end = current_time   │
│  └── Status = "completed"             │
│                                        │
└────────────────────────────────────────┘
```

## Database Fields Explained

```python
class Drive:
    # User input when creating drive
    scheduled_start: DateTime | None  # When exam SHOULD start (planned)
    duration_minutes: int             # How long exam should run
    
    # System-managed (auto-set)
    actual_start: DateTime | None     # When exam ACTUALLY started
    actual_end: DateTime | None       # When exam ACTUALLY ended
```

## Example Scenarios

### Scenario 1: Scheduled with Auto-Start
```
1. Create drive: scheduled_start = "Dec 26, 2025 2:00 PM", duration = 60 mins
2. Admin approves
3. Send emails at 1:30 PM
4. Wait...
5. At 2:00 PM → System auto-starts (actual_start = 2:00 PM)
6. Exam runs...
7. At 3:00 PM → System auto-ends (actual_end = 3:00 PM)
```

### Scenario 2: Scheduled but Manual Start
```
1. Create drive: scheduled_start = "Dec 26, 2025 2:00 PM", duration = 60 mins
2. Admin approves
3. Send emails at 1:30 PM
4. At 1:45 PM → Company clicks "Start Now" (actual_start = 1:45 PM)
5. Exam runs...
6. At 2:45 PM → System auto-ends (actual_end = 2:45 PM)
   (Note: Ends 60 mins after ACTUAL start, not scheduled start)
```

### Scenario 3: No Schedule, Manual Only
```
1. Create drive: scheduled_start = NULL, duration = 60 mins
2. Admin approves
3. Send emails
4. Company clicks "Start Now" whenever ready (actual_start = clicked time)
5. Exam runs...
6. System auto-ends after 60 minutes from actual_start
```

### Scenario 4: Manual End Before Duration
```
1. Create drive: duration = 60 mins
2. Start exam (actual_start = 2:00 PM)
3. After 30 mins → Company clicks "End Manually" (actual_end = 2:30 PM)
4. Exam ends immediately (students can't continue)
```

## UI Changes

### Send Emails Page
**Before scheduled time:**
```
┌─────────────────────────────────────────────────┐
│ 📅 Exam is scheduled to start automatically at  │
│    Dec 26, 2025 2:00:00 PM                     │
│                                                 │
│ You can also start the exam manually before    │
│ the scheduled time.                             │
│                                                 │
│ [🚀 Start Exam Now]                             │
└─────────────────────────────────────────────────┘
```

**After scheduled time or no schedule:**
```
┌─────────────────────────────────────────────────┐
│ ℹ️ Emails have been sent to students.          │
│   Click below to start the exam.               │
│                                                 │
│ [🚀 Start Exam Now]                             │
└─────────────────────────────────────────────────┘
```

### Drive Detail Page
**When exam is ongoing:**
```
┌─────────────────────────────────────────────────┐
│ 🟢 Exam is Currently Ongoing                    │
│                                                 │
│ Started at: Dec 26, 2025 2:00:00 PM            │
│ Duration: 60 minutes                            │
│ ⏱️ Time Remaining: 45 minutes                  │
│                                                 │
│ Note: Exam will automatically end when          │
│ duration expires.                               │
│                                                 │
│ [🛑 End Exam Manually]                          │
└─────────────────────────────────────────────────┘
```

## Key Points

### ✅ What Works Automatically
1. **Scheduled Start**: If `scheduled_start` is set, exam starts at that time
2. **Duration-Based End**: Exam always ends after `duration_minutes` from `actual_start`
3. **Polling**: System checks every 30 seconds for scheduled starts and auto-ends

### ✅ What Company Controls
1. **Manual Start**: Can start before scheduled time
2. **Manual End**: Can end exam early (emergency stop)

### ⚠️ Important Notes
- `scheduled_start` is **optional** (can be NULL)
- If no `scheduled_start`, exam can only be started manually
- Duration is always counted from `actual_start`, not `scheduled_start`
- Once started (manually or auto), the other start method is no longer available

## Database Auto-Creation

**Good News**: In development mode, you don't need to do anything!

```bash
# Just start your backend server
cd backend
uvicorn app.main:app --reload
```

**What happens automatically:**
1. SQLAlchemy sees your models
2. Creates all tables if they don't exist
3. Includes all fields: `scheduled_start`, `actual_start`, `actual_end`, `duration_minutes`
4. You can immediately start using the application

**For a fresh start (delete existing DB):**
```bash
# Delete your database file (usually cxp.db or similar)
# Then restart the server - fresh tables will be created
```

## Testing Checklist

### Test 1: Auto-Start at Scheduled Time
- [ ] Create drive with scheduled_start = 1 minute from now
- [ ] Send emails
- [ ] Wait for scheduled time
- [ ] Verify exam auto-starts
- [ ] Check `actual_start` is set in database

### Test 2: Manual Start Before Schedule
- [ ] Create drive with scheduled_start = 1 hour from now
- [ ] Send emails
- [ ] Click "Start Now" immediately
- [ ] Verify exam starts before scheduled time
- [ ] Check `actual_start` is current time

### Test 3: No Schedule, Manual Only
- [ ] Create drive with no scheduled_start
- [ ] Send emails
- [ ] Click "Start Now"
- [ ] Verify exam starts

### Test 4: Auto-End After Duration
- [ ] Start exam with 1-minute duration
- [ ] Wait 1 minute
- [ ] Verify exam auto-ends
- [ ] Check `actual_end` is set

### Test 5: Manual End During Exam
- [ ] Start exam
- [ ] Click "End Manually" after 30 seconds
- [ ] Verify exam ends immediately
- [ ] Check `actual_end` is set

## Files Modified

1. ✅ `backend/app/routes/company.py` - Added scheduled auto-start logic
2. ✅ `frontend-react/src/pages/CompanySendEmails.jsx` - Show scheduled time info
3. ✅ `frontend-react/src/pages/CompanyDriveDetail.jsx` - Display scheduled start

## Summary

You now have a **hybrid system**:
- 🤖 **Automatic**: Exams start at scheduled time and end after duration
- 👤 **Manual**: Companies can override and start/end manually anytime

Best of both worlds! 🎉
