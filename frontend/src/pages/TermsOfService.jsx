import { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function TermsOfService() {
  useEffect(() => { document.title = "Terms of Service — AdMarket"; }, []);
  const { language } = useLanguage();
  const isHe = language === "he";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to={createPageUrl("Home")} className="text-blue-600 hover:underline text-sm mb-6 inline-block">
          ← {isHe ? "חזרה לדף הבית" : "Back to Home"}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isHe ? "תנאי שימוש" : "Terms of Service"}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {isHe ? "עודכן לאחרונה: יוני 2025" : "Last updated: June 2025"}
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "1. קבלת התנאים" : "1. Acceptance of Terms"}
            </h2>
            <p>
              {isHe
                ? "על ידי גישה לאתר AdMarket או שימוש בשירותינו, אתה מסכים להיות מחויב לתנאי שימוש אלה. אם אינך מסכים לתנאים אלה, אנא אל תשתמש בשירות."
                : "By accessing or using AdMarket, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "2. תיאור השירות" : "2. Description of Service"}
            </h2>
            <p>
              {isHe
                ? "AdMarket היא פלטפורמה המחברת בין מפרסמים לבעלי ערוצי טלגרם. הפלטפורמה מאפשרת פרסום מודעות, ניהול בקשות פרסום וסטטיסטיקות קמפיין."
                : "AdMarket is a marketplace platform that connects advertisers with Telegram channel owners. The platform enables ad placement, management of ad requests, and campaign analytics."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "3. חשבונות משתמש" : "3. User Accounts"}
            </h2>
            <p>
              {isHe
                ? "עליך להיות בן 18 לפחות כדי להשתמש בשירות. אתה אחראי לשמור על סודיות פרטי הכניסה לחשבונך ועל כל הפעילות המתרחשת תחת חשבונך."
                : "You must be at least 18 years old to use the service. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "4. חובות מפרסמים" : "4. Advertiser Obligations"}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              {isHe ? (
                <>
                  <li>לספק תוכן מודעה מדויק, חוקי ולא מטעה</li>
                  <li>לא לפרסם תוכן פוגעני, מיני, גזעני, או תוכן הקשור לסמים/הימורים</li>
                  <li>לכבד את זכויות הקניין הרוחני של צדדים שלישיים</li>
                  <li>לשלם את עמלות הפלטפורמה במועד הקבוע</li>
                </>
              ) : (
                <>
                  <li>Provide accurate, lawful, and non-deceptive ad content</li>
                  <li>Not advertise offensive, adult, racist content, or content related to drugs/gambling</li>
                  <li>Respect the intellectual property rights of third parties</li>
                  <li>Pay platform fees on time</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "5. חובות בעלי ערוצים" : "5. Channel Owner Obligations"}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              {isHe ? (
                <>
                  <li>לספק מידע מדויק על הערוץ בעת הרישום</li>
                  <li>לפרסם מודעות שאושרו בזמן שסוכם</li>
                  <li>לא להונות מפרסמים לגבי נתוני הערוץ</li>
                  <li>לציין בפוסטים ממומנים שהם פרסומת בהתאם לחוק</li>
                </>
              ) : (
                <>
                  <li>Provide accurate channel information upon registration</li>
                  <li>Publish approved ads at the agreed time</li>
                  <li>Not deceive advertisers about channel statistics</li>
                  <li>Label sponsored posts as advertisements as required by law</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "6. עמלות ותשלומים" : "6. Fees and Payments"}
            </h2>
            <p>
              {isHe
                ? "AdMarket גובה עמלת שירות מכל עסקה שמבוצעת בפלטפורמה. שיעור העמלה מוצג בבירור לפני השלמת כל עסקה. התשלומים מעובדים דרך ספקי תשלום מאובטחים."
                : "AdMarket charges a service fee on each transaction completed on the platform. The fee rate is clearly displayed before completing any transaction. Payments are processed through secure payment providers."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "7. אמנות תוכן ובינה מלאכותית" : "7. Content Moderation & AI"}
            </h2>
            <p>
              {isHe
                ? "כל המודעות עוברות סינון אוטומטי באמצעות בינה מלאכותית ובדיקה ידנית על ידי צוותנו. אנו שומרים לעצמנו את הזכות לדחות כל מודעה שאינה עומדת בהנחיות הפלטפורמה."
                : "All ads undergo automated AI screening and manual review by our team. We reserve the right to reject any ad that does not meet our platform guidelines."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "8. הגבלת אחריות" : "8. Limitation of Liability"}
            </h2>
            <p>
              {isHe
                ? "AdMarket אינה אחראית לנזקים עקיפים, תוצאתיים, או מיוחדים הנובעים משימוש בשירות. אחריותנו הכוללת לא תעלה על הסכום ששולם על ידך ב-12 החודשים האחרונים."
                : "AdMarket is not liable for indirect, consequential, or special damages arising from the use of the service. Our total liability shall not exceed the amount paid by you in the last 12 months."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "9. סיום ועצירת חשבון" : "9. Termination"}
            </h2>
            <p>
              {isHe
                ? "אנו שומרים לעצמנו את הזכות להשעות או לסגור חשבונות שמפרים תנאים אלה, לאחר מתן הודעה מתאימה. משתמשים יכולים לסגור את חשבונם בכל עת דרך הגדרות החשבון."
                : "We reserve the right to suspend or close accounts that violate these terms, following appropriate notice. Users may close their account at any time through account settings."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "10. שינויים בתנאים" : "10. Changes to Terms"}
            </h2>
            <p>
              {isHe
                ? "אנו עשויים לעדכן תנאים אלה מעת לעת. נודיע למשתמשים על שינויים מהותיים באמצעות אימייל או הודעה בפלטפורמה. המשך השימוש בשירות לאחר שינויים מהווה הסכמה לתנאים החדשים."
                : "We may update these terms from time to time. We will notify users of material changes by email or in-platform notice. Continued use of the service after changes constitutes acceptance of the new terms."}
            </p>
          </section>

          <div className="border-t pt-6 text-sm text-gray-500">
            {isHe
              ? "לשאלות בנוגע לתנאי השימוש, פנה אלינו בכתובת "
              : "For questions about these Terms, contact us at "}
            <a href="mailto:support@admarket.com" className="text-blue-600 hover:underline">
              support@admarket.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
