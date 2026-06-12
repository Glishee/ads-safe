import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Clock, HelpCircle } from "lucide-react";

export default function ContactUs() {
  useEffect(() => { document.title = "Contact Us — AdMarket"; }, []);
  const { language } = useLanguage();
  const isHe = language === "he";
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const mailto = `mailto:support@admarket.com?subject=${encodeURIComponent(form.subject || "Support Request")}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailto;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to={createPageUrl("Home")} className="text-blue-600 hover:underline text-sm mb-6 inline-block">
          ← {isHe ? "חזרה לדף הבית" : "Back to Home"}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isHe ? "צור קשר" : "Contact Us"}
        </h1>
        <p className="text-gray-500 mb-10">
          {isHe
            ? "נשמח לעזור. בחר את הדרך המועדפת עליך לפנות אלינו."
            : "We're here to help. Choose your preferred way to reach us."}
        </p>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Contact channels */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {isHe ? "אימייל תמיכה" : "Support Email"}
                </h3>
                <a href="mailto:support@admarket.com" className="text-blue-600 hover:underline text-sm">
                  support@admarket.com
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  {isHe ? "זמן תגובה: עד 24 שעות" : "Response time: within 24 hours"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {isHe ? "תמיכה בטלגרם" : "Telegram Support"}
                </h3>
                <p className="text-sm text-gray-600">@admarket_support</p>
                <p className="text-xs text-gray-500 mt-1">
                  {isHe ? "זמן תגובה: עד 4 שעות" : "Response time: within 4 hours"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {isHe ? "שעות פעילות" : "Working Hours"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isHe ? "ראשון – חמישי: 09:00 – 18:00" : "Mon – Fri: 09:00 – 18:00"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isHe ? "שעון ישראל (UTC+3)" : "Israel Time (UTC+3)"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {isHe ? "סוגי פניות" : "Types of Inquiries"}
                </h3>
                <ul className="text-sm text-gray-600 space-y-0.5">
                  {isHe ? (
                    <>
                      <li>• בעיות טכניות בפלטפורמה</li>
                      <li>• שאלות על תשלומים ועמלות</li>
                      <li>• אישור / דחיית ערוץ</li>
                      <li>• דיווח על הפרת תנאים</li>
                    </>
                  ) : (
                    <>
                      <li>• Technical platform issues</li>
                      <li>• Payment and fee questions</li>
                      <li>• Channel approval / rejection</li>
                      <li>• Terms of service violations</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {isHe ? "שלח לנו הודעה" : "Send Us a Message"}
            </h2>

            {sent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-green-600" />
                </div>
                <p className="text-gray-800 font-medium">
                  {isHe ? "נפתח לך אפליקציית האימייל" : "Your email client has been opened"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {isHe ? "שלח את ההודעה כדי שנחזור אליך בהקדם." : "Send the message and we'll get back to you shortly."}
                </p>
                <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>
                  {isHe ? "שלח פנייה נוספת" : "Send another message"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isHe ? "שם מלא" : "Full Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={isHe ? "ישראל ישראלי" : "John Smith"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isHe ? "אימייל" : "Email"} *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isHe ? "נושא" : "Subject"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={isHe ? "תיאור קצר של הבעיה" : "Brief description of the issue"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isHe ? "הודעה" : "Message"} *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder={isHe ? "פרט את הבעיה..." : "Describe your issue in detail..."}
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  {isHe ? "שלח הודעה" : "Send Message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
