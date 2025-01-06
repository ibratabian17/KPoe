var dictionary = {
    "en": {
        "sing_button": "SING!",
        "intro": "Welcome To KPoe!<br> Press enter to start. Old UI may require your own songdb",
        "please_wait": "Please Wait",
        "songlist_warn": "This game requires a song list from the user",
        "click_start_web": "Click me to start the game",
        "sing": "Sing",
        "confirm": "Confirm",
        "refresh_songlist": "Refresh Songlist",
        "back": "Back",
        "press_enter": "Press {KEY_VALIDATE} to play!",
        "exit": "Exit",
        "paused": "PAUSED",
        "continue": "Continue",
        "loading_songdata": "Loading Song Data..."
    },
    "id": {
        "sing_button": "NYANYI!",
        "intro": "Selamat Datang di KPoe!<br> Tekan enter untuk memulai. UI lama mungkin memerlukan database lagu Anda sendiri",
        "please_wait": "Tunggu Sebentar",
        "songlist_warn": "Game ini membutuhkan daftar lagu dari pengguna",
        "click_start_web": "Klik saya untuk memulai permainan",
        "sing": "Nyanyi",
        "confirm": "Konfirmasi",
        "refresh_songlist": "Segarkan Daftar Lagu",
        "back": "Kembali",
        "press_enter": "Tekan {KEY_VALIDATE} untuk bermain!",
        "exit": "Keluar",
        "paused": "DIJEDA",
        "continue": "Lanjutkan",
        "loading_songdata": "Memuat Data Lagu..."
    },
    "ar": {
        "sing_button": "!غنّي",
        "intro": "مرحبًا بك في KPoe!<br> لبدء اللعبة، اضغط على Enter. قد تتطلب واجهة المستخدم القديمة قاعدة بيانات الأغاني الخاصة بك",
        "please_wait": "انتظر لحظة",
        "songlist_warn": "تتطلب هذه اللعبة قائمة أغاني من المستخدم",
        "click_start_web": "انقر فوقي لبدء اللعبة",
        "sing": "غنّي！",
        "confirm": "تأكيد",
        "refresh_songlist": "تحديث قائمة الأغاني",
        "back": "العودة",
        "press_enter": "اضغط {KEY_VALIDATE} للتشغيل!",
        "exit": "الخروج",
        "paused": "توقف مؤقتاً",
        "continue": "متابعة التشغيل",
        "loading_songdata": "...تحميل بيانات الأغنية"
    }
}

const currentLanguage = localStorage.getItem('lang') || "en"
function getLocalizedLang(name){
return dictionary[currentLanguage][name]
}

function updateLocalizedText() {
    const elements = document.querySelectorAll('[dict-lang-id]');

    elements.forEach(element => {
        const dictLangId = element.getAttribute('dict-lang-id');
        const localizedText = getLocalizedLang(dictLangId);

        if (localizedText) {
            element.innerHTML = localizedText;
        }
    });
}