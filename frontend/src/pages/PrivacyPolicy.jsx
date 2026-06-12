import { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function PrivacyPolicy() {
  useEffect(() => { document.title = "Privacy Policy — AdMarket"; }, []);
  const { language } = useLanguage();
  const isHe = language === "he";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to={createPageUrl("Home")} className="text-blue-600 hover:underline text-sm mb-6 inline-block">
          ← {isHe ? "חזרה לדף הבית" : "Back to Home"}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isHe ? "מדיניות פרטיות" : "Privacy Policy"}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {isHe ? "עודכן לאחרונה: יוני 2025" : "Last updated: June 2025"}
        </p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "1. מידע שאנו אוספים" : "1. Information We Collect"}
            </h2>
            <p className="mb-3">
              {isHe ? "אנו אוספים את סוגי המידע הבאים:" : "We collect the following types of information:"}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              {isHe ? (
                <>
                  <li><strong>מידע חשבון:</strong> שם, כתובת אימייל, שם משתמש וסיסמה מוצפנת</li>
                  <li><strong>מידע ערוץ:</strong> מזהה ערוץ Telegram, שם, תיאור וסטטיסטיקות ציבוריות</li>
                  <li><strong>נתוני שימוש:</strong> עמודים שנצפו, פעולות בפלטפורמה, זמני כניסה</li>
                  <li><strong>נתוני תשלום:</strong> פרטי עסקאות (לא נשמרים פרטי כרטיס אשראי)</li>
                </>
              ) : (
                <>
                  <li><strong>Account info:</strong> name, email address, username, and encrypted password</li>
                  <li><strong>Channel info:</strong> Telegram channel ID, name, description, and public statistics</li>
                  <li><strong>Usage data:</strong> pages viewed, platform actions, login times</li>
                  <li><strong>Payment data:</strong> transaction details (credit card details are never stored)</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "2. כיצד אנו משתמשים במידע" : "2. How We Use Your Information"}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              {isHe ? (
                <>
                  <li>לאמת את זהותך ולנהל את חשבונך</li>
                  <li>לעבד עסקאות ולשלוח אישורים</li>
                  <li>לשפר את השירות ולהתאים אישית את חוויית המשתמש</li>
                  <li>לשלוח עדכונים חשובים על השירות (לא ספאם)</li>
                  <li>לאכוף את תנאי השירות ולמנוע הונאות</li>
                </>
              ) : (
                <>
                  <li>Verify your identity and manage your account</li>
                  <li>Process transactions and send confirmations</li>
                  <li>Improve the service and personalise the user experience</li>
                  <li>Send important service updates (not spam)</li>
                  <li>Enforce Terms of Service and prevent fraud</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "3. שיתוף מידע" : "3. Information Sharing"}
            </h2>
            <p>
              {isHe
                ? "אנו לא מוכרים, משכירים, או מעבירים את המידע האישי שלך לצדדים שלישיים, למעט במקרים הבאים:"
                : "We do not sell, rent, or transfer your personal information to third parties, except in the following cases:"}
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              {isHe ? (
                <>
                  <li>ספקי שירות הכרחיים (אחסון, עיבוד תשלומים) — תחת הסכמי סודיות</li>
                  <li>כאשר נדרש על פי חוק או צו שיפוטי</li>
                  <li>להגנה על זכויות AdMarket במקרה של הפרת תנאים</li>
                </>
              ) : (
                <>
                  <li>Essential service providers (hosting, payment processing) — under confidentiality agreements</li>
                  <li>When required by law or court order</li>
                  <li>To protect AdMarket's rights in case of terms violation</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "4. עוגיות (Cookies)" : "4. Cookies"}
            </h2>
            <p>
              {isHe
                ? "אנו משתמשים בעוגיות הכרחיות לתפקוד הפלטפורמה (שמירת מצב כניסה, העדפות שפה). אינך יכול להשתמש בפלטפורמה ללא עוגיות אלה."
                : "We use essential cookies for platform functionality (login state, language preferences). You cannot use the platform without these cookies."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "5. אבטחת מידע" : "5. Data Security"}
            </h2>
            <p>
              {isHe
                ? "אנו מיישמים אמצעי אבטחה סטנדרטיים בתעשייה: הצפנת HTTPS, סיסמאות מוצפנות (bcrypt), ובקרות גישה מחמירות. עם זאת, אף שיטה אינה מאובטחת לחלוטין."
                : "We implement industry-standard security measures: HTTPS encryption, hashed passwords (bcrypt), and strict access controls. However, no method is completely secure."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "6. שמירת מידע" : "6. Data Retention"}
            </h2>
            <p>
              {isHe
                ? "אנו שומרים את המידע שלך כל עוד חשבונך פעיל. לאחר מחיקת החשבון, המידע נמחק תוך 30 יום, למעט מידע הנדרש לצרכים חשבונאיים וחוקיים (עד 7 שנים)."
                : "We retain your data for as long as your account is active. After account deletion, data is removed within 30 days, except information required for accounting and legal purposes (up to 7 years)."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "7. הזכויות שלך" : "7. Your Rights"}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              {isHe ? (
                <>
                  <li>גישה למידע האישי שלך</li>
                  <li>תיקון מידע שגוי</li>
                  <li>מחיקת חשבונך ומידע אישי</li>
                  <li>העברת המידע שלך (data portability)</li>
                  <li>התנגדות לעיבוד המידע לצרכי שיווק</li>
                </>
              ) : (
                <>
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and personal information</li>
                  <li>Data portability</li>
                  <li>Object to processing for marketing purposes</li>
                </>
              )}
            </ul>
            <p className="mt-3 text-sm">
              {isHe
                ? "לממש זכויות אלה, צור קשר: "
                : "To exercise these rights, contact us at "}
              <a href="mailto:support@admarket.com" className="text-blue-600 hover:underline">
                support@admarket.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isHe ? "8. שינויים במדיניות" : "8. Changes to This Policy"}
            </h2>
            <p>
              {isHe
                ? "אנו עשויים לעדכן מדיניות זו מעת לעת. נודיע למשתמשים על שינויים מהותיים 30 יום מראש באמצעות אימייל."
                : "We may update this policy from time to time. We will notify users of material changes 30 days in advance by email."}
            </p>
          </section>

          <div className="border-t pt-6 text-sm text-gray-500">
            {isHe ? "שאלות על הפרטיות שלך: " : "Privacy questions: "}
            <a href="mailto:support@admarket.com" className="text-blue-600 hover:underline">
              support@admarket.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
