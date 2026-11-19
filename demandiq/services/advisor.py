"""
DemandIQ Natural Language Advisory Service
Generates concise, actionable one-sentence Bangla & English advice per SKU (PRD FR11).
No invented numbers.
"""

def to_bangla_digits(num):
    bn_digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
    return "".join(bn_digits[int(d)] if d.isdigit() else d for d in str(num))

def generate_advisory(sku_name, plan, currency="BDT"):
    status = plan["status"]
    days_cover = plan["days_of_cover"]
    order_qty = plan["order_qty"]
    lost_rev = plan["lost_revenue"]
    cash_tied = plan["cash_tied_up"]
    stockout_date = plan["stockout_date"]

    taka_symbol = "৳" if currency == "BDT" else "$"

    if status == "critical":
        msg_bn = f"স্টক {to_bangla_digits(days_cover)} দিনে শেষ হবে! {taka_symbol}{to_bangla_digits(int(lost_rev))} বিক্রির ক্ষতি এড়াতে আজই {to_bangla_digits(order_qty)} পিস অর্ডার করুন।"
        msg_en = f"Stock runs out in {days_cover} days! Place an order for {order_qty} units today to protect {taka_symbol}{int(lost_rev):,} in sales."
    elif status == "soon":
        msg_bn = f"এই সপ্তাহের মধ্যে {to_bangla_digits(order_qty)} পিস অর্ডার করুন। বর্তমান স্টকে মাত্র {to_bangla_digits(days_cover)} দিন চলবে।"
        msg_en = f"Reorder {order_qty} units this week. Current stock covers only {days_cover} days."
    elif status == "ok":
        msg_bn = f"মজুত একদম ঠিক আছে। আগামী {to_bangla_digits(days_cover)} দিনের পর্যাপ্ত স্টক রয়েছে।"
        msg_en = f"Stock is healthy. Sufficient coverage for the next {days_cover} days."
    elif status == "overstock":
        msg_bn = f"বেশি স্টক: {taka_symbol}{to_bangla_digits(int(cash_tied))} অলস আটকে আছে। দ্রুত ক্যাশ তুলতে বান্ডেল বা বিশেষ ছাড়ের অফার দিন।"
        msg_en = f"Overstock: {taka_symbol}{int(cash_tied):,} capital locked. Run a bundle discount to unlock cash."
    else: # dead
        msg_bn = f"বিক্রি নেই: বিগত ৬০ দিনে বিক্রি না হওয়ায় {taka_symbol}{to_bangla_digits(int(cash_tied))} টাকা আটকে আছে। স্টক ক্লিয়ারেন্স সেল দিন।"
        msg_en = f"Dead stock: Zero recent sales with {taka_symbol}{int(cash_tied):,} tied up. Immediate clearance recommended."

    return {
        "message_bn": msg_bn,
        "message_en": msg_en
    }
