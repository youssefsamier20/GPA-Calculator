# 🎓 Advanced Credit-Hour GPA Calculator
> تطبيق ويب احترافي مبني بـ React و TypeScript لحساب المعدل الفصلي والتراكمي (GPA / CGPA) بدقة متناهية، مصمم خصيصاً ليطابق اللوائح الأكاديمية لنظام الساعات المعتمدة في الجامعات المصرية.

## 🚀 About The Project
This project is a highly accurate GPA calculator that goes beyond simple math. It incorporates complex university business rules, strict input validations, and an intelligent state-sharing mechanism to provide students with a flawless and seamless experience.

## ✨ Key Features

### 🧠 Advanced Academic Logic
* **Retaken Courses Handling:** Perfectly calculates CGPA by accounting for courses failed in previous semesters, ensuring attempted and passed credits are balanced without duplication.
* **Dual Grading Scales:** Fully supports both **5.0** and **4.0** GPA scales, with custom mapping where the passing grade starts at **60%** (Standard Egyptian Universities logic).
* **Smart Passed Credits:** Automatically separates registered credits from actually passed credits based on grades (handling 'F' grades accurately in the final CGPA).

### 🛡️ Dynamic Validations & Security
* **Dynamic Course Limits:** The minimum number of allowed courses automatically adjusts based on the total registered credit hours (e.g., 20-21 hours require at least 6 courses).
* **Credit Rules:** Strict enforcement of university rules (e.g., maximum of one 5-credit course, maximum of two 4-credit courses).
* **Input Protection:** Accidental mouse-scroll values changes are completely disabled (`onWheel` blur) for all numeric inputs to ensure data integrity.

### 🔄 Seamless User Experience (UX)
* **Smart Auto-Fill:** Calculates the Term GPA and automatically carries the data (GPA, Credits, Courses, and Failed Courses) over to the CGPA calculator if the user chooses to proceed.
* **Real-time Course GPA:** Displays a live preview of the GPA and Grade (A, B, C...) for each individual course as the user types the score.
* **Arabic Localization:** High-quality Arabic interface with ordinal numbering (المادة الأولى، الثانية...) instead of basic numbers.

## 🛠️ Built With
* **React** (Functional Components, Hooks)
* **TypeScript** (Strict typing & Interfaces)
* **Tailwind CSS** (Responsive & Modern Styling)
* **Lucide React** (Icons)

## 📌 Status
- [x] Term GPA Logic & UI
- [x] Cumulative CGPA Logic & UI
- [x] Cross-Component State Sharing
- [ ] Final UI Polish & Edge Case Testing (90% Completed)

---
💡 *Built with clean code principles and an obsession with accurate academic logic.*
