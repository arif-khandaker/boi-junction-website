# বই জংশন (Boi Junction)

আরিফ খন্দকারের বই বিক্রির সাইট। বইয়ের তথ্য `script.js`-এর BOOKS অংশে; বইয়ের আলাদা পাতা বানাতে `node tools/build_books.js`।

## অর্ডার সংরক্ষণ ও ব্যবস্থাপনা পাতা
- অর্ডার পাঠালে `orders.js` Firestore-এ `orders/{BJ-…}` ও `orderStatus/{BJ-…}` লেখে (ব্যর্থ হলেও অর্ডারের কাজ আটকায় না)।
- নিয়ম (rules): `firestore.rules`। Firebase কনসোল → Firestore Database → Rules-এ বসিয়ে Publish করতে হবে।
- ব্যবস্থাপনা পাতা: `/admin/` (শুধু `admins/{uid}` ডকুমেন্ট থাকা অ্যাকাউন্টে খোলে)। এখানে অর্ডার, অবস্থা বদল ও বিক্রির হিসাব।
- পাঠকের পাতা: `readers.json`-এ `[{"name":"…","book":"…","text":"…","photo":"ছবির ফাইল"}]` লিখলে সাইটে আসে।
