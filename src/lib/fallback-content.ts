// Embedded fallback content for offline/error scenarios
// This content is bundled with the app and always available

export const FALLBACK_STORE_INFO = {
  name: "Gorilla.kw",
  nameAr: "Gorilla.kw",
  description: "At Gorilla.kw, we believe fragrance is more than just a scent – it’s a lifestyle and a statement of individuality.",
  descriptionAr: "وسائل تعليمية تنمي تفكير وذكاء الأطفال",
  phone: "+96567791911",
  email: "gorilla.kwt25@gmail.com",
  whatsapp: "https://wa.me/96567791911",
  instagram: "https://www.instagram.com/Gorilla.kw",
  location: "Kuwait",
  locationAr: "الكويت"
};

export const FALLBACK_CATEGORIES = [
  {
    id: 1,
    name: "Gorilla",
    nameAr: "ألعاب تعليمية",
    description: "Games that enhance learning"
  },
  {
    id: 2,
    name: "Building Blocks",
    nameAr: "مكعبات البناء",
    description: "Creative building toys"
  },
  {
    id: 3,
    name: "Puzzles",
    nameAr: "الألغاز",
    description: "Mind-challenging puzzles"
  },
  {
    id: 4,
    name: "Art & Crafts",
    nameAr: "الفنون والحرف",
    description: "Creative art activities"
  },
  {
    id: 5,
    name: "Science Kits",
    nameAr: "مجموعات العلوم",
    description: "Hands-on science learning"
  },
  {
    id: 6,
    name: "Books",
    nameAr: "الكتب",
    description: "Educational reading materials"
  }
];

export const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "Magnetic Building Set",
    nameAr: "مجموعة البناء المغناطيسية",
    price: 25.000,
    currency: "KWD",
    category: "Building Blocks",
    categoryAr: "مكعبات البناء",
    description: "Creative magnetic building blocks for spatial thinking",
    descriptionAr: "مكعبات بناء مغناطيسية إبداعية لتنمية التفكير المكاني"
  },
  {
    id: 2,
    name: "Educational Puzzle Game",
    nameAr: "لعبة الألغاز التعليمية",
    price: 15.500,
    currency: "KWD",
    category: "Puzzles",
    categoryAr: "الألغاز",
    description: "Mind-challenging puzzles for problem solving",
    descriptionAr: "ألغاز تتحدى العقل لحل المشكلات"
  },
  {
    id: 3,
    name: "Science Experiment Kit",
    nameAr: "مجموعة التجارب العلمية",
    price: 35.000,
    currency: "KWD",
    category: "Science Kits",
    categoryAr: "مجموعات العلوم",
    description: "Hands-on science experiments for young learners",
    descriptionAr: "تجارب علمية عملية للمتعلمين الصغار"
  },
  {
    id: 4,
    name: "Art & Craft Set",
    nameAr: "مجموعة الفنون والحرف",
    price: 20.000,
    currency: "KWD",
    category: "Art & Crafts",
    categoryAr: "الفنون والحرف",
    description: "Complete art set for creative expression",
    descriptionAr: "مجموعة فنية كاملة للتعبير الإبداعي"
  },
  {
    id: 5,
    name: "Interactive Learning Book",
    nameAr: "كتاب التعلم التفاعلي",
    price: 12.000,
    currency: "KWD",
    category: "Books",
    categoryAr: "الكتب",
    description: "Interactive book with learning activities",
    descriptionAr: "كتاب تفاعلي مع أنشطة تعليمية"
  },
  {
    id: 6,
    name: "Logic Game Set",
    nameAr: "مجموعة ألعاب المنطق",
    price: 18.750,
    currency: "KWD",
    category: "Educational Games",
    categoryAr: "ألعاب تعليمية",
    description: "Games that develop logical thinking",
    descriptionAr: "ألعاب تطور التفكير المنطقي"
  }
];

export const FALLBACK_CONFIG = {
  currency_list: [
    {
      id: 1,
      code: "KWD",
      symbol: "KD",
      status: true,
      exchange_rate: "1"
    }
  ],
  decimal_point_settings: 3
};

// Error messages for different scenarios
export const ERROR_MESSAGES = {
  offline: {
    en: {
      title: "You're Offline",
      message: "No internet connection. Showing saved content.",
      action: "Try Again"
    },
    ar: {
      title: "لا يوجد اتصال",
      message: "لا يوجد اتصال بالإنترنت. يتم عرض المحتوى المحفوظ.",
      action: "إعادة المحاولة"
    }
  },
  apiError: {
    en: {
      title: "Connection Problem",
      message: "Having trouble connecting to our servers. Showing sample products.",
      action: "Retry",
      contact: "Contact us if the problem persists"
    },
    ar: {
      title: "مشكلة في الاتصال",
      message: "نواجه مشكلة في الاتصال بخوادمنا. يتم عرض منتجات عينة.",
      action: "إعادة المحاولة",
      contact: "اتصل بنا إذا استمرت المشكلة"
    }
  },
  timeout: {
    en: {
      title: "Slow Connection",
      message: "Your connection seems slow. We'll keep trying to load fresh content.",
      action: "Refresh Page"
    },
    ar: {
      title: "اتصال بطيء",
      message: "يبدو أن اتصالك بطيء. سنستمر في محاولة تحميل المحتوى الجديد.",
      action: "تحديث الصفحة"
    }
  }
};

// Helper functions
export function getFallbackContent(language: string) {
  const isArabic = language === 'ar';
  
  return {
    store: {
      name: isArabic ? FALLBACK_STORE_INFO.nameAr : FALLBACK_STORE_INFO.name,
      description: isArabic ? FALLBACK_STORE_INFO.descriptionAr : FALLBACK_STORE_INFO.description,
      phone: FALLBACK_STORE_INFO.phone,
      email: FALLBACK_STORE_INFO.email,
      whatsapp: FALLBACK_STORE_INFO.whatsapp,
      instagram: FALLBACK_STORE_INFO.instagram,
      location: isArabic ? FALLBACK_STORE_INFO.locationAr : FALLBACK_STORE_INFO.location
    },
    categories: FALLBACK_CATEGORIES.map(cat => ({
      ...cat,
      name: isArabic ? cat.nameAr : cat.name
    })),
    products: FALLBACK_PRODUCTS.map(product => ({
      ...product,
      name: isArabic ? product.nameAr : product.name,
      description: isArabic ? product.descriptionAr : product.description,
      category: isArabic ? FALLBACK_CATEGORIES.find(c => c.name === product.category)?.nameAr || product.category : product.category
    })),
    config: FALLBACK_CONFIG
  };
}

export function getErrorMessage(type: keyof typeof ERROR_MESSAGES, language: string) {
  const isArabic = language === 'ar';
  return ERROR_MESSAGES[type][isArabic ? 'ar' : 'en'];
} 