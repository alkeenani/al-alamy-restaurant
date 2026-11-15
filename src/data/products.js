export const menuCategories = [
  { id: 'sandwiches', label: 'الساندوتشات' },
  { id: 'crepes', label: 'الكريبات' },
]

export function getCategoryLabel(categoryId) {
  return (
    menuCategories.find((category) => category.id === categoryId)?.label ??
    categoryId
  )
}

export const demoPriceNotice =
  'الأسعار وخيارات المنتجات الحالية تجريبية لأغراض العرض فقط، وسيتم تحديثها لاحقاً من لوحة التحكم.'

export const products = [
  {
    id: 'batates-farm',
    name: 'بطاطس فارم',
    category: 'sandwiches',
    price: 30,
  },
  {
    id: 'batates-farm-cheese',
    name: 'بطاطس فارم بالجبنة',
    category: 'sandwiches',
    price: 40,
  },
  {
    id: 'kebda-iskandarani',
    name: 'كبدة إسكندراني',
    category: 'sandwiches',
    price: 45,
    options: [
      {
        id: 'size',
        label: 'الحجم',
        kind: 'size',
        required: true,
        priceMode: 'absolute',
        values: [
          { id: 'regular', label: 'عادي', price: 45 },
          { id: 'large', label: 'كبير', price: 60 },
        ],
      },
    ],
  },
  {
    id: 'kofta',
    name: 'كفتة',
    category: 'sandwiches',
    price: 50,
  },
  {
    id: 'kofta-charcoal',
    name: 'كفتة على الفحم',
    category: 'sandwiches',
    price: 60,
    options: [
      {
        id: 'size',
        label: 'الحجم',
        kind: 'size',
        required: true,
        priceMode: 'absolute',
        values: [
          { id: 'regular', label: 'عادي', price: 60 },
          { id: 'large', label: 'كبير', price: 75 },
        ],
      },
    ],
  },
  {
    id: 'kofta-mozzarella',
    name: 'كفتة موزاريلا',
    category: 'sandwiches',
    price: 65,
  },
  {
    id: 'hawawshi-baladi',
    name: 'حواوشي بلدي',
    category: 'sandwiches',
    price: 45,
  },
  {
    id: 'burger',
    name: 'برجر',
    category: 'sandwiches',
    price: 45,
  },
  {
    id: 'cheeseburger',
    name: 'تشيز برجر',
    category: 'sandwiches',
    price: 55,
  },
  {
    id: 'double-burger',
    name: 'دبل برجر',
    category: 'sandwiches',
    price: 70,
  },
  {
    id: 'sausage',
    name: 'سوسيس',
    category: 'sandwiches',
    price: 35,
  },
  {
    id: 'hot-dog',
    name: 'هوت دوج',
    category: 'sandwiches',
    price: 40,
  },
  {
    id: 'sogok',
    name: 'سجق',
    category: 'sandwiches',
    price: 45,
  },
  {
    id: 'shawarma-chicken',
    name: 'شاورما فراخ',
    category: 'sandwiches',
    price: 55,
    options: [
      {
        id: 'size',
        label: 'الحجم',
        kind: 'size',
        required: true,
        priceMode: 'absolute',
        values: [
          { id: 'regular', label: 'عادي', price: 55 },
          { id: 'large', label: 'كبير', price: 70 },
        ],
      },
      {
        id: 'sandwich-type',
        label: 'نوع الساندوتش',
        kind: 'variant',
        required: true,
        priceMode: 'none',
        values: [
          { id: 'regular', label: 'عادي' },
          { id: 'syrian', label: 'سوري' },
        ],
      },
    ],
  },
  {
    id: 'shish-tawook',
    name: 'شيش طاووق',
    category: 'sandwiches',
    price: 60,
    options: [
      {
        id: 'size',
        label: 'الحجم',
        kind: 'size',
        required: true,
        priceMode: 'absolute',
        values: [
          { id: 'regular', label: 'عادي', price: 60 },
          { id: 'large', label: 'كبير', price: 75 },
        ],
      },
    ],
  },
  {
    id: 'super-crunchy',
    name: 'سوبر كرانشي',
    category: 'sandwiches',
    price: 65,
  },
  {
    id: 'zinger',
    name: 'زنجر',
    category: 'sandwiches',
    price: 55,
  },
  {
    id: 'crispy',
    name: 'كرسبي',
    category: 'sandwiches',
    price: 50,
  },
  {
    id: 'paneeh',
    name: 'بانيه',
    category: 'sandwiches',
    price: 55,
  },
  {
    id: 'cordon-bleu',
    name: 'كوردن بلو',
    category: 'sandwiches',
    price: 65,
  },
  {
    id: 'crepe-mixed-cheese',
    name: 'كريب مشكل جبن',
    category: 'crepes',
    price: 55,
    options: [
      {
        id: 'size',
        label: 'الحجم',
        kind: 'size',
        required: true,
        priceMode: 'absolute',
        values: [
          { id: 'regular', label: 'عادي', price: 55 },
          { id: 'large', label: 'كبير', price: 70 },
        ],
      },
    ],
  },
  {
    id: 'crepe-potato',
    name: 'كريب بطاطس',
    category: 'crepes',
    price: 45,
  },
  {
    id: 'crepe-hot-dog',
    name: 'كريب هوت دوج',
    category: 'crepes',
    price: 50,
  },
  {
    id: 'crepe-sausage',
    name: 'كريب سوسيس',
    category: 'crepes',
    price: 45,
  },
  {
    id: 'crepe-burger',
    name: 'كريب برجر',
    category: 'crepes',
    price: 55,
  },
  {
    id: 'crepe-kebda-iskandarani',
    name: 'كريب كبدة إسكندراني',
    category: 'crepes',
    price: 55,
  },
  {
    id: 'crepe-kofta',
    name: 'كريب كفتة',
    category: 'crepes',
    price: 60,
    options: [
      {
        id: 'size',
        label: 'الحجم',
        kind: 'size',
        required: true,
        priceMode: 'absolute',
        values: [
          { id: 'regular', label: 'عادي', price: 60 },
          { id: 'large', label: 'كبير', price: 75 },
        ],
      },
    ],
  },
  {
    id: 'crepe-kofta-charcoal',
    name: 'كريب كفتة على الفحم',
    category: 'crepes',
    price: 70,
  },
  {
    id: 'crepe-mixed-meat',
    name: 'كريب مشكل لحم',
    category: 'crepes',
    price: 75,
  },
  {
    id: 'crepe-sharky-sausage',
    name: 'كريب سجق شرقي',
    category: 'crepes',
    price: 55,
  },
  {
    id: 'crepe-cono-al-alamy',
    name: 'كريب كونو العالمي',
    category: 'crepes',
    price: 80,
    options: [
      {
        id: 'size',
        label: 'الحجم',
        kind: 'size',
        required: true,
        priceMode: 'absolute',
        values: [
          { id: 'regular', label: 'عادي', price: 80 },
          { id: 'large', label: 'كبير', price: 100 },
        ],
      },
    ],
  },
  {
    id: 'crepe-paneeh',
    name: 'كريب بانيه',
    category: 'crepes',
    price: 65,
  },
  {
    id: 'crepe-super-crunchy',
    name: 'كريب سوبر كرانشي',
    category: 'crepes',
    price: 70,
  },
  {
    id: 'crepe-zinger',
    name: 'كريب زنجر',
    category: 'crepes',
    price: 65,
  },
  {
    id: 'crepe-crispy',
    name: 'كريب كرسبي',
    category: 'crepes',
    price: 60,
  },
  {
    id: 'crepe-shish-tawook',
    name: 'كريب شيش طاووق',
    category: 'crepes',
    price: 70,
  },
  {
    id: 'crepe-shawarma-chicken',
    name: 'كريب شاورما فراخ',
    category: 'crepes',
    price: 65,
    options: [
      {
        id: 'size',
        label: 'الحجم',
        kind: 'size',
        required: true,
        priceMode: 'absolute',
        values: [
          { id: 'regular', label: 'عادي', price: 65 },
          { id: 'large', label: 'كبير', price: 80 },
        ],
      },
    ],
  },
  {
    id: 'crepe-cordon-bleu',
    name: 'كريب كوردن بلو',
    category: 'crepes',
    price: 75,
  },
  {
    id: 'crepe-mixed-chicken',
    name: 'كريب مشكل فراخ',
    category: 'crepes',
    price: 80,
    options: [
      {
        id: 'size',
        label: 'الحجم',
        kind: 'size',
        required: true,
        priceMode: 'absolute',
        values: [
          { id: 'regular', label: 'عادي', price: 80 },
          { id: 'large', label: 'كبير', price: 100 },
        ],
      },
    ],
  },
]
