import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs";

const plans = {
  Free: {
    USD: 100, // $1 test payment
    INR: 100, // ₹1 test payment
  },
  Builder: {
    USD: 1900, // $19
    INR: 183900, // ₹1,839
  },
  Pro: {
    USD: 4900, // $49
    INR: 474300, // ₹4,743
  },
  Scale: {
    USD: 9900, // $99
    INR: 958300, // ₹9,583
  },
} as const;

type PlanName = keyof typeof plans;
type Currency = "USD" | "INR";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan, currency } = body;

    if (
      typeof plan !== "string" ||
      !Object.prototype.hasOwnProperty.call(plans, plan)
    ) {
      return NextResponse.json(
        { error: "Invalid plan. Choose Free, Builder, Pro, or Scale." },
        { status: 400 }
      );
    }

    if (currency !== "USD" && currency !== "INR") {
      return NextResponse.json(
        { error: "Invalid currency. Choose USD or INR." },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay API keys are not configured." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const selectedPlan = plan as PlanName;
    const selectedCurrency = currency as Currency;
    const amount = plans[selectedPlan][selectedCurrency];

    const order = await razorpay.orders.create({
      amount,
      currency: selectedCurrency,
      receipt: `${selectedPlan.toLowerCase()}_${selectedCurrency.toLowerCase()}_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      plan: selectedPlan,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}

