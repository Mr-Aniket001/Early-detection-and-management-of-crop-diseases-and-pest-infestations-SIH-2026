// Initialize the hidden Google Translate engine
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi,bn,te,mr,ta,gu,kn,pa,ml',
        autoDisplay: false
    }, 'google_translate_element');
}

// Function triggered when the user selects a language from your dropdown
function translateLanguage(langCode) {
    // 1. Set the cookie so the choice persists across all Flask routes
    // The path=/ ensures it works on /farmer, /spreading, etc.
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    
    // 2. Trigger the hidden Google widget to translate the current page immediately
    var selectField = document.querySelector(".goog-te-combo");
    if (selectField) {
        selectField.value = langCode;
        selectField.dispatchEvent(new Event('change'));
    }
}

// When any page loads, check the cookie and update the dropdown to match
document.addEventListener("DOMContentLoaded", function() {
    var match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
    if (match) {
        var lang = match[1].split('/')[2]; // Extracts 'hi' from '/en/hi'
        var dropdown = document.getElementById('language-selector');
        if (dropdown && lang) {
            dropdown.value = lang;
        }
    }
});