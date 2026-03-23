import React, { useState, useEffect } from 'react';
import { BookOpen, Calculator, Loader2, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { type SharedData } from '../App';

interface CourseData {
  id: number;
  name: string;
  credits: number | '';
  score: number | '';
  hasFailedBefore: boolean;
}

const arabicOrdinals = [
  "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة",
  "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة"
];

const getArabicGrade = (grade: string) => {
  if (grade.includes('A')) return 'امتياز';
  if (grade.includes('B')) return 'جيد جداً';
  if (grade.includes('C')) return 'جيد';
  if (grade.includes('D')) return 'مقبول';
  return 'راسب';
};

const calculateCourseGPA = (score: number | '', scale: number | ''): { gpa: string, grade: string, arabicGrade: string } | null => {
  if (score === '' || scale === '') return null;
  const s = Number(score);
  if (s < 0 || s > 100 || !Number.isInteger(s)) return null;

  if (scale === 5) {
    if (s < 60) return { gpa: '0.0', grade: 'F', arabicGrade: 'راسب' };
    if (s <= 64) return { gpa: (1.0 + (s - 60) * 0.1).toFixed(1), grade: 'D', arabicGrade: 'مقبول' };
    if (s <= 74) return { gpa: (1.5 + (s - 65) * 0.1).toFixed(1), grade: 'C', arabicGrade: 'جيد' };
    if (s <= 84) return { gpa: (2.5 + (s - 75) * 0.1).toFixed(1), grade: 'B', arabicGrade: 'جيد جداً' };
    if (s <= 100) return { gpa: (3.5 + (s - 85) * 0.1).toFixed(1), grade: 'A', arabicGrade: 'امتياز' };
  }

  if (scale === 4) {
    let gpa = '0.0', grade = 'F';
    if (s < 60) { gpa = '0.0'; grade = 'F'; }
    else if (s <= 64) { gpa = '1.8'; grade = 'D+'; }
    else if (s <= 68) { gpa = '2.0'; grade = 'C-'; }
    else if (s <= 71) { gpa = '2.3'; grade = 'C'; }
    else if (s <= 74) { gpa = '2.5'; grade = 'C+'; }
    else if (s <= 78) { gpa = '2.7'; grade = 'B-'; }
    else if (s <= 81) { gpa = '3.1'; grade = 'B'; }
    else if (s <= 84) { gpa = '3.5'; grade = 'B+'; }
    else if (s <= 86) { gpa = '3.7'; grade = 'A-'; }
    else if (s <= 88) { gpa = '3.9'; grade = 'A'; }
    else if (s <= 100) { gpa = '4.0'; grade = 'A+'; }

    return { gpa, grade, arabicGrade: getArabicGrade(grade) };
  }
  
  return null;
};

const TermGPA: React.FC<{ onCalculate: (data: SharedData) => void }> = ({ onCalculate }) => {
  const [gpaScale, setGpaScale] = useState<number | ''>('');
  const [creditHours, setCreditHours] = useState<number | ''>('');
  const [numCourses, setNumCourses] = useState<number | ''>('');
  const [courses, setCourses] = useState<CourseData[]>([]);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [finalGPA, setFinalGPA] = useState<string>('0.00');

  const isCreditHoursInvalid = creditHours !== '' && (Number(creditHours) < 12 || Number(creditHours) > 21);

  let minCoursesAllowed = 4;
  if (creditHours !== '' && !isCreditHoursInvalid) {
    const ch = Number(creditHours);
    if (ch === 20 || ch === 21) minCoursesAllowed = 6;
    else if (ch >= 17 && ch <= 19) minCoursesAllowed = 5;
  }

  const isNumCoursesInvalid = numCourses !== '' && (Number(numCourses) < minCoursesAllowed || Number(numCourses) > 10);

  useEffect(() => {
    if (numCourses !== '' && !isNumCoursesInvalid) {
      const count = Number(numCourses);
      setCourses((prev) => {
        const newCourses = [...prev];
        if (newCourses.length < count) {
          for (let i = newCourses.length; i < count; i++) {
            newCourses.push({ id: i, name: '', credits: '', score: '', hasFailedBefore: false });
          }
        } else if (newCourses.length > count) {
          newCourses.splice(count);
        }
        return newCourses;
      });
    }
  }, [numCourses, isNumCoursesInvalid]);

  const handleCourseChange = (id: number, field: keyof CourseData, value: string | number | boolean) => {
    setCourses(courses.map(course => 
      course.id === id ? { ...course, [field]: value } : course
    ));
    setShowResult(false);
  };

  const getDuplicateNames = () => {
    const names = courses.map(c => c.name.trim()).filter(n => n !== '');
    return names.filter((item, index) => names.indexOf(item) !== index);
  };
  const duplicateNames = getDuplicateNames();

  const totalEnteredCredits = courses.reduce((sum, course) => {
    return sum + (course.credits === '' ? 0 : Number(course.credits));
  }, 0);

  const count5Credits = courses.filter(c => c.credits === 5).length;
  const count4Credits = courses.filter(c => c.credits === 4).length;
  const hasTooMany5Credits = count5Credits > 1;
  const hasTooMany4Credits = count4Credits > 2;

  const allCreditsFilled = courses.length > 0 && courses.every(c => c.credits !== '');
  const isTotalCreditsExceeded = creditHours !== '' && totalEnteredCredits > Number(creditHours);
  const isTotalCreditsShort = creditHours !== '' && allCreditsFilled && totalEnteredCredits < Number(creditHours);
  const isTotalCreditsExact = creditHours !== '' && allCreditsFilled && totalEnteredCredits === Number(creditHours);

  const hasEmptyFields = courses.length > 0 && courses.some(c => c.name.trim() === '' || c.credits === '' || c.score === '');

  const hasAnyErrors = courses.some(c => {
    const isNameDup = c.name.trim() !== '' && duplicateNames.includes(c.name.trim());
    const isScoreInvalid = c.score !== '' && (Number(c.score) < 0 || Number(c.score) > 100 || !Number.isInteger(Number(c.score)));
    const isCreditsInvalid = c.credits !== '' && (Number(c.credits) < 1 || Number(c.credits) > 5 || !Number.isInteger(Number(c.credits)));
    return isNameDup || isScoreInvalid || isCreditsInvalid;
  });

  const canCalculate = !hasEmptyFields && !hasAnyErrors && isTotalCreditsExact && !hasTooMany5Credits && !hasTooMany4Credits && courses.length > 0;

  // ---------------- Logic الحساب النهائي ----------------
  const handleCalculate = () => {
    if (!canCalculate) return;
    setIsCalculating(true);
    setShowResult(false);

    let totalPoints = 0;
    let totalDenominatorCredits = 0;
    let failedCreditsSum = 0; // متغير جديد لجمع ساعات الرسوب
    const retakenCoursesList: {name: string, credits: number}[] = [];

    courses.forEach(course => {
      const credits = Number(course.credits);
      const courseResult = calculateCourseGPA(course.score, gpaScale);
      
      if (courseResult) {
        const courseGPA = Number(courseResult.gpa);
        
        if (course.hasFailedBefore) {
          retakenCoursesList.push({ name: course.name, credits: credits });
        }

        // لو المادة دي راسب، اجمع ساعاتها
        if (courseResult.grade === 'F') {
          failedCreditsSum += credits;
        }
        
        totalPoints += (courseGPA * credits);

        if (course.hasFailedBefore) {
          totalDenominatorCredits += (credits * 2);
        } else {
          totalDenominatorCredits += credits;
        }
      }
    });

    const calculatedTermGPA = totalPoints / totalDenominatorCredits;
    const finalGPAString = calculatedTermGPA.toFixed(2);
    
    // إرسال الداتا شاملة ساعات الرسوب
    onCalculate({
      scale: gpaScale,
      termGPA: finalGPAString,
      termCredits: Number(creditHours),
      termPoints: totalPoints,
      termCourses: Number(numCourses),
      retakenCourses: retakenCoursesList,
      failedTermCredits: failedCreditsSum // السطر الجديد هنا
    });

    setTimeout(() => {
      setFinalGPA(finalGPAString);
      setIsCalculating(false);
      setShowResult(true);
    }, 1500);
  };
  // ---------------------------------------------------
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <BookOpen size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">إعدادات معدل الترم</h2>
      </div>

      <div className="space-y-6">
        <div className="animate-in fade-in duration-500">
          <label className="block text-sm font-bold text-gray-700 mb-2">1. اختر نظام الـ GPA</label>
          <select
            value={gpaScale}
            onChange={(e) => setGpaScale(Number(e.target.value))}
            className={`w-full md:w-1/2 p-3 border rounded-lg outline-none transition-all ${
              gpaScale === '' ? 'text-gray-400 font-medium italic border-gray-300' : 'text-gray-900 border-indigo-500 ring-2 ring-indigo-200'
            }`}
          >
            <option value="" disabled>-- اضغط لاختيار النظام --</option>
            <option value={4} className="text-gray-900 not-italic">من 4.0</option>
            <option value={5} className="text-gray-900 not-italic">من 5.0</option>
          </select>
        </div>

        {gpaScale !== '' && (
          <div className="animate-in fade-in duration-500">
            <label className="block text-sm font-bold text-gray-700 mb-2">2. إجمالي الساعات المسجلة</label>
            <input
              type="number"
              step="1"
              placeholder="مثال: 18 (الحد الأدنى 12 والأقصى 21)"
              value={creditHours}
              onChange={(e) => setCreditHours(e.target.value === '' ? '' : Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              className={`w-full md:w-1/2 p-3 border rounded-lg outline-none transition-all font-medium ${
                isCreditHoursInvalid || (creditHours !== '' && !Number.isInteger(Number(creditHours)))
                  ? 'border-red-500 ring-2 ring-red-200 text-red-600 bg-red-50' 
                  : creditHours !== '' ? 'border-indigo-500 ring-2 ring-indigo-200 text-gray-900' : 'border-gray-300 placeholder-gray-400 italic'
              }`}
            />
            {isCreditHoursInvalid && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-semibold">
                <AlertCircle size={16} /> عدد الساعات يجب أن يكون بين 12 و 21.
              </p>
            )}
          </div>
        )}

        {gpaScale !== '' && creditHours !== '' && !isCreditHoursInvalid && Number.isInteger(Number(creditHours)) && (
          <div className="animate-in fade-in duration-500">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              3. عدد المواد المسجلة <span className="text-indigo-600 text-xs">(الحد الأدنى {minCoursesAllowed})</span>
            </label>
            <input
              type="number"
              step="1"
              placeholder={`مثال: 6 (الحد الأدنى ${minCoursesAllowed} والأقصى 10)`}
              value={numCourses}
              onChange={(e) => setNumCourses(e.target.value === '' ? '' : Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              className={`w-full md:w-1/2 p-3 border rounded-lg outline-none transition-all font-medium ${
                isNumCoursesInvalid || (numCourses !== '' && !Number.isInteger(Number(numCourses)))
                  ? 'border-red-500 ring-2 ring-red-200 text-red-600 bg-red-50' 
                  : numCourses !== '' ? 'border-indigo-500 ring-2 ring-indigo-200 text-gray-900' : 'border-gray-300 placeholder-gray-400 italic'
              }`}
            />
            {isNumCoursesInvalid && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-semibold">
                <AlertCircle size={16} /> عدد المواد يجب أن يكون بين {minCoursesAllowed} و 10.
              </p>
            )}
          </div>
        )}
      </div>

      {gpaScale !== '' && creditHours !== '' && !isCreditHoursInvalid && Number.isInteger(Number(creditHours)) && numCourses !== '' && !isNumCoursesInvalid && Number.isInteger(Number(numCourses)) && (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-4 gap-4">
            <h3 className="text-lg font-bold text-gray-800">4. تفاصيل المواد</h3>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              isTotalCreditsExceeded || isTotalCreditsShort ? 'bg-red-100 text-red-700 border border-red-200' 
              : isTotalCreditsExact ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
            }`}>
              {isTotalCreditsExact ? <CheckCircle2 size={18} /> : <Info size={18} />}
              <span>إجمالي الساعات المدخلة: {totalEnteredCredits} / {creditHours}</span>
            </div>
          </div>

          <div className="space-y-5">
            {courses.map((course, index) => {
              const isNameDup = course.name.trim() !== '' && duplicateNames.includes(course.name.trim());
              const isScoreInvalid = course.score !== '' && (Number(course.score) < 0 || Number(course.score) > 100 || !Number.isInteger(Number(course.score)));
              const isCreditsInvalid = course.credits !== '' && (Number(course.credits) < 1 || Number(course.credits) > 5 || !Number.isInteger(Number(course.credits)));
              const hasRowError = isNameDup || isScoreInvalid || isCreditsInvalid;
              
              const liveData = calculateCourseGPA(course.score, gpaScale);

              return (
                <div key={course.id} className={`flex flex-col bg-gray-50 p-4 rounded-xl border transition-colors ${
                  hasRowError ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300'
                }`}>
                  <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <span className="w-8 h-8 hidden md:flex flex-shrink-0 items-center justify-center bg-indigo-100 text-indigo-700 font-bold rounded-full text-sm">
                      {index + 1}
                    </span>
                    
                    <input
                      type="text"
                      placeholder={`اسم المادة ${arabicOrdinals[index]}`}
                      value={course.name}
                      onChange={(e) => handleCourseChange(course.id, 'name', e.target.value)}
                      className={`flex-2 p-2.5 bg-white border rounded-lg focus:ring-2 outline-none placeholder-gray-400 font-medium ${
                        isNameDup ? 'border-red-500 focus:ring-red-500 text-red-600' : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                    />

                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="5"
                      placeholder="الساعات (1-5)"
                      value={course.credits}
                      onChange={(e) => handleCourseChange(course.id, 'credits', e.target.value === '' ? '' : Number(e.target.value))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className={`flex-1 p-2.5 bg-white border rounded-lg focus:ring-2 outline-none placeholder-gray-400 font-medium ${
                        isCreditsInvalid ? 'border-red-500 focus:ring-red-500 text-red-600' : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                    />

                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="الدرجة (0-100)"
                      value={course.score}
                      onChange={(e) => handleCourseChange(course.id, 'score', e.target.value === '' ? '' : Number(e.target.value))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className={`flex-1 p-2.5 bg-white border rounded-lg focus:ring-2 outline-none placeholder-gray-400 font-medium ${
                        isScoreInvalid ? 'border-red-500 focus:ring-red-500 text-red-600' : 'border-gray-300 focus:ring-indigo-500 text-indigo-700'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-3 px-1 gap-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={course.hasFailedBefore} 
                        onChange={(e) => handleCourseChange(course.id, 'hasFailedBefore', e.target.checked)} 
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                      />
                      هل رسبت في هذه المادة سابقاً؟
                    </label>
                    
                    {liveData && !isScoreInvalid && (
                      <span className={`text-sm font-bold px-3 py-1.5 rounded-md border flex items-center gap-1.5 ${
                        liveData.grade === 'F' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        GPA المادة: {liveData.gpa} | {liveData.grade} 
                        <span className={`text-[11px] px-1.5 py-0.5 rounded shadow-sm ${
                          liveData.grade === 'F' ? 'bg-red-200/60' : 'bg-white/60'
                        }`}>
                          ({liveData.arabicGrade})
                        </span>
                      </span>
                    )}
                  </div>

                  {isNameDup && <span className="text-red-500 text-sm font-semibold flex items-center gap-1 mt-2"><AlertCircle size={14}/> اسم المادة مكرر!</span>}
                  {isCreditsInvalid && <span className="text-red-500 text-sm font-semibold flex items-center gap-1 mt-2"><AlertCircle size={14}/> الساعات من 1 لـ 5 (بدون كسور).</span>}
                  {isScoreInvalid && <span className="text-red-500 text-sm font-semibold flex items-center gap-1 mt-2"><AlertCircle size={14}/> الدرجة من 0 لـ 100 (بدون كسور).</span>}
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            {hasTooMany5Credits && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={18} /> لا يمكن تسجيل أكثر من مادة واحدة بـ 5 ساعات معتمدة.
              </div>
            )}
            {hasTooMany4Credits && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={18} /> لا يمكن تسجيل أكثر من مادتين بـ 4 ساعات معتمدة.
              </div>
            )}
            {isTotalCreditsExceeded && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={18} /> مجموع الساعات الموزعة ({totalEnteredCredits}) يتجاوز الساعات المسجلة ({creditHours}).
              </div>
            )}
            {isTotalCreditsShort && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={18} /> مجموع الساعات الموزعة ({totalEnteredCredits}) أقل من الساعات المسجلة ({creditHours}). يرجى مراجعة الساعات لتتطابق تماماً.
              </div>
            )}
            {hasEmptyFields && !isTotalCreditsExceeded && !isTotalCreditsShort && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm font-semibold flex items-center gap-2">
                <AlertCircle size={18} /> يرجى ملء جميع الخانات لتتمكن من حساب المعدل.
              </div>
            )}
          </div>

          <button
            onClick={handleCalculate}
            disabled={isCalculating || !canCalculate}
            className={`w-full mt-6 font-bold py-4 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 
              ${!canCalculate ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-70'}`}
          >
            {isCalculating ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                جاري المعالجة...
              </>
            ) : (
              <>
                <Calculator size={24} />
                احسب الـ GPA
              </>
            )}
          </button>
        </div>
      )}

      {showResult && (
        <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl text-center animate-in zoom-in duration-500 shadow-inner">
          <p className="text-gray-600 font-semibold mb-2">المعدل الفصلي (Term GPA) هو:</p>
          <h3 className="text-6xl font-black text-indigo-600 tracking-tight">{finalGPA}</h3>
          <p className="text-sm text-gray-500 mt-4 font-medium flex items-center justify-center gap-1">
            <CheckCircle2 size={16} className="text-emerald-500" />
            تم الحساب بناءً على إجمالي {creditHours} ساعة معتمدة.
          </p>
        </div>
      )}
    </div>
  );
};

export default TermGPA;