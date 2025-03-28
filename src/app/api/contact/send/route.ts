import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message, recipient } = await request.json();

    // Validate inputs
    if (!name || !email || !subject || !message || !recipient) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Create subject line based on the selected subject
    let subjectLine = "";
    switch (subject) {
      case "general":
        subjectLine = "General Inquiry from UniShare Contact Form";
        break;
      case "technical":
        subjectLine = "Technical Support Request from UniShare Contact Form";
        break;
      case "feedback":
        subjectLine = "Feedback from UniShare Contact Form";
        break;
      case "report":
        subjectLine = "Issue Report from UniShare Contact Form";
        break;
      case "other":
        subjectLine = "Other Inquiry from UniShare Contact Form";
        break;
      default:
        subjectLine = "Message from UniShare Contact Form";
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "UniShare <contact@unishare.app>",
      to: [recipient],
      subject: subjectLine,
      reply_to: email,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6b7280;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-line;">${message}</p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            This email was sent from the UniShare contact form.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
