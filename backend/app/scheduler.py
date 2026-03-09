# backend/app/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import func, extract
from datetime import datetime, date
import calendar

from .database import SessionLocal
from .models import (
    Bill, BillStatus, FinancialEvent, EventType, 
    BillCycle, BillCycleStatus, Notification, NotificationSeverity,
    User, SavingsGoal, Debt, NetWorthSnapshot
)
from .utils.payment_engine import check_payment_status
from .utils.financial_engine import calculate_net_worth

def check_overdue_bills():
    """Daily job: Mark overdue bills and apply late fees."""
    db = SessionLocal()
    try:
        today = datetime.utcnow()
        pending_bills = db.query(Bill).filter(
            Bill.status == BillStatus.PENDING,
            Bill.is_active == True
        ).all()
        
        for bill in pending_bills:
            if bill.next_due_date and bill.next_due_date < today:
                # Mark as overdue
                bill.status = BillStatus.OVERDUE
                
                # Log event
                event = FinancialEvent(
                    user_id=bill.user_id,
                    event_type=EventType.PAYMENT_MISSED,
                    description=f"Payment overdue for {bill.bill_name} — due {bill.next_due_date.strftime('%d %b')}",
                    amount=bill.total_amount_due,
                    reference_type="bill",
                    reference_id=bill.id
                )
                db.add(event)
                
                # Apply late fee as separate event if applicable
                if bill.late_fee > 0:
                    fee_event = FinancialEvent(
                        user_id=bill.user_id,
                        event_type=EventType.LATE_FEE_ADDED,
                        description=f"Late fee of ₹{bill.late_fee:,.0f} applied to {bill.bill_name}",
                        amount=bill.late_fee,
                        reference_type="bill",
                        reference_id=bill.id
                    )
                    db.add(fee_event)
        
        db.commit()
        print(f"[Scheduler] Checked {len(pending_bills)} bills at {today}")
    
    except Exception as e:
        print(f"[Scheduler] Error in check_overdue_bills: {e}")
    finally:
        db.close()

def generate_bill_cycles():
    """
    Daily job: Check if today matches a bill's billing_cycle_day.
    If so, create a new BillCycle record for this month.
    """
    db = SessionLocal()
    try:
        today = datetime.utcnow()
        current_day = today.day

        # Find bills whose billing cycle starts today
        bills = db.query(Bill).filter(
            Bill.billing_cycle_day == current_day,
            Bill.is_active == True
        ).all()

        for bill in bills:
            # Check if cycle already exists for this month
            existing = db.query(BillCycle).filter(
                BillCycle.bill_id == bill.id,
                extract('month', BillCycle.cycle_start) == today.month,
                extract('year', BillCycle.cycle_start) == today.year
            ).first()

            if existing:
                continue  # Already generated this month

            # Calculate cycle end (last day of month)
            last_day = calendar.monthrange(today.year, today.month)[1]
            cycle_end = today.replace(day=last_day, hour=23, minute=59, second=59)

            # Calculate due date (due_date_day of NEXT month)
            if today.month == 12:
                due_month, due_year = 1, today.year + 1
            else:
                due_month, due_year = today.month + 1, today.year

            try:
                due_date = today.replace(
                    year=due_year,
                    month=due_month,
                    day=bill.due_date_day,
                    hour=23, minute=59, second=59
                )
            except ValueError:
                last_due_day = calendar.monthrange(due_year, due_month)[1]
                due_date = today.replace(
                    year=due_year, month=due_month,
                    day=last_due_day, hour=23, minute=59, second=59
                )

            # Minimum due = 5% of outstanding balance
            min_due = max(200, bill.outstanding_balance * 0.05)

            cycle = BillCycle(
                bill_id=bill.id,
                user_id=bill.user_id,
                cycle_start=today.replace(hour=0, minute=0, second=0),
                cycle_end=cycle_end,
                due_date=due_date,
                amount_due=bill.outstanding_balance,
                minimum_due=round(min_due, 2),
                paid_amount=0,
                status=BillCycleStatus.OPEN
            )
            db.add(cycle)

        db.commit()
        print(f"[Scheduler] Bill cycles generated for {len(bills)} bills on day {current_day}")

    except Exception as e:
        print(f"[Scheduler] Error in generate_bill_cycles: {e}")
    finally:
        db.close()

def generate_notifications():
    """
    Daily job: Check all financial conditions and create notifications.
    """
    db = SessionLocal()
    try:
        today = datetime.utcnow()
        today_date = today.date()

        users = db.query(User).all()

        for user in users:
            existing_today = db.query(Notification).filter(
                Notification.user_id == user.id,
                func.date(Notification.created_at) == today_date
            ).all()
            existing_refs = {(n.reference_type, n.reference_id) for n in existing_today}

            # ── Check 1: Bills due within 3 days ──────────────────────────
            bills = db.query(Bill).filter(
                Bill.user_id == user.id,
                Bill.is_active == True,
                Bill.status == BillStatus.PENDING
            ).all()

            for bill in bills:
                if not bill.next_due_date:
                    continue
                days_until = (bill.next_due_date.date() - today_date).days

                if 0 <= days_until <= 3 and ("bill", bill.id) not in existing_refs:
                    severity = NotificationSeverity.CRITICAL if days_until == 0 else NotificationSeverity.WARNING
                    title = f"Bill Due {'Today' if days_until == 0 else f'in {days_until} day(s)'}"
                    message = f"{bill.bill_name}: ₹{bill.total_amount_due:,.0f} due on {bill.next_due_date.strftime('%d %b')}"
                    db.add(Notification(
                        user_id=user.id, title=title, message=message,
                        severity=severity, reference_type="bill", reference_id=bill.id
                    ))

            # ── Check 2: Overdue bills ─────────────────────────────────────
            overdue_bills = db.query(Bill).filter(
                Bill.user_id == user.id,
                Bill.is_active == True,
                Bill.status == BillStatus.OVERDUE
            ).all()

            for bill in overdue_bills:
                if ("bill_overdue", bill.id) not in existing_refs:
                    days_late = (today_date - bill.next_due_date.date()).days if bill.next_due_date else 0
                    db.add(Notification(
                        user_id=user.id,
                        title="Payment Overdue",
                        message=f"{bill.bill_name} is {days_late} day(s) overdue. "
                                f"Late fee: ₹{bill.late_fee:,.0f}",
                        severity=NotificationSeverity.CRITICAL,
                        reference_type="bill_overdue",
                        reference_id=bill.id
                    ))

            # ── Check 3: Goal deadlines within 7 days ─────────────────────
            goals = db.query(SavingsGoal).filter(
                SavingsGoal.user_id == user.id,
                SavingsGoal.is_achieved == False
            ).all()

            for goal in goals:
                if not goal.target_date:
                    continue
                days_to_goal = (goal.target_date.date() - today_date).days
                if 0 <= days_to_goal <= 7 and ("goal", goal.id) not in existing_refs:
                    progress = (goal.current_saved / goal.target_amount * 100) if goal.target_amount > 0 else 0
                    db.add(Notification(
                        user_id=user.id,
                        title="Goal Deadline Approaching",
                        message=f"'{goal.goal_name}' deadline in {days_to_goal} day(s). "
                                f"Progress: {progress:.0f}% of ₹{goal.target_amount:,.0f}",
                        severity=NotificationSeverity.WARNING,
                        reference_type="goal", reference_id=goal.id
                    ))

        db.commit()
        print(f"[Scheduler] Notifications generated at {today}")

    except Exception as e:
        print(f"[Scheduler] Error in generate_notifications: {e}")
    finally:
        db.close()

def daily_networth_snapshot():
    """
    Daily job: Take a snapshot of user's net worth.
    """
    db = SessionLocal()
    try:
        today = datetime.utcnow().date()
        users = db.query(User).all()

        for user in users:
            existing = db.query(NetWorthSnapshot).filter(
                NetWorthSnapshot.user_id == user.id,
                func.date(NetWorthSnapshot.snapshot_date) == today
            ).first()

            nw = calculate_net_worth(user, db)
            if existing:
                existing.total_assets = nw["assets"]["total"]
                existing.total_liabilities = nw["liabilities"]["total"]
                existing.net_worth = nw["net_worth"]
                existing.investments = nw["assets"]["investments"]
                existing.savings = nw["assets"]["savings"]
                existing.total_debt = nw["liabilities"]["loans"]
                existing.credit_outstanding = nw["liabilities"]["credit_cards"]
            else:
                snapshot = NetWorthSnapshot(
                    user_id=user.id,
                    total_assets=nw["assets"]["total"],
                    total_liabilities=nw["liabilities"]["total"],
                    net_worth=nw["net_worth"],
                    investments=nw["assets"]["investments"],
                    savings=nw["assets"]["savings"],
                    total_debt=nw["liabilities"]["loans"],
                    credit_outstanding=nw["liabilities"]["credit_cards"]
                )
                db.add(snapshot)

        db.commit()
        print(f"[Scheduler] Net worth snapshots saved for {len(users)} users")

    except Exception as e:
        print(f"[Scheduler] Error in daily_networth_snapshot: {e}")
    finally:
        db.close()

def start_scheduler():
    """
    Start the background scheduler with cron-based timing.
    """
    scheduler = BackgroundScheduler(
        job_defaults={
            'coalesce': True,
            'misfire_grace_time': 3600
        }
    )

    midnight = CronTrigger(hour=0, minute=0, second=0)

    scheduler.add_job(check_overdue_bills, trigger=midnight, id='check_overdue_bills', replace_existing=True)
    scheduler.add_job(generate_bill_cycles, trigger=midnight, id='generate_bill_cycles', replace_existing=True)
    scheduler.add_job(generate_notifications, trigger=midnight, id='generate_notifications', replace_existing=True)
    scheduler.add_job(daily_networth_snapshot, trigger=midnight, id='daily_networth_snapshot', replace_existing=True)

    scheduler.start()
    print("[Scheduler] Started — all jobs scheduled at midnight UTC")
    return scheduler
