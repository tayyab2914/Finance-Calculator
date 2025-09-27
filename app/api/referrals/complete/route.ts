import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase with service role key (server only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)


export async function POST(req: NextRequest) {
  try {
    const { refereeUserId } = await req.json();

    if (!refereeUserId) {
      return NextResponse.json({ error: "Missing refereeUserId" }, { status: 400 });
    }

    // 1️⃣ Get referee profile email
    const { data: referee, error: refereeError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", refereeUserId)
      .single();

    if (refereeError || !referee) {
      return NextResponse.json({ error: "Referee not found" }, { status: 404 });
    }

    // 2️⃣ Find pending referral for this referee
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select("*")
      .eq("referee_email", referee.email)
      .eq("status", "pending")
      .single();

    if (referralError || !referral) {
      return NextResponse.json({ message: "No pending referral found", success: false });
    }

    // 3️⃣ Update referral to completed
    const { error: updateError } = await supabase
      .from("referrals")
      .update({
        referee_id: refereeUserId,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", referral.id);

    if (updateError) {
      throw new Error(`Failed to complete referral: ${updateError.message}`);
    }

    // 4️⃣ Update referee profile to track who referred them
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ referred_by: referral.referrer_id })
      .eq("id", refereeUserId);

    if (profileError) {
      console.error("Failed to update referee profile:", profileError);
    }

    return NextResponse.json({ success: true, referralId: referral.id });
  } catch (err: any) {
    console.error("❌ Complete referral API error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
