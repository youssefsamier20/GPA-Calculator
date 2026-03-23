import React, { useState, useEffect } from 'react';
import { GraduationCap, AlertCircle, Info, Sparkles, Loader2, Calculator, CheckCircle2, BookOpen } from 'lucide-react';
import { type SharedData, type RetakenCourse } from '../App';

interface CumulativeGPAProps {
  sharedData: SharedData;
}

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

const CumulativeGPA: React.FC<CumulativeGPAProps> = ({ sharedData }) => {
  const [hasCalculatedTerm, setHasCalculatedTerm] = useState<boolean | null>(null);
  
  const [prevCGPA, setPrevCGPA] = useState<number | ''>('');
  const [prevPassedCredits, setPrevPassedCredits] = useState<number | ''>('');
  const [termCredits, setTermCredits] = useState<number | ''>('');
  const [termCoursesCount, setTermCoursesCount] = useState<number | ''>('');
  
  const [termGPA, setTermGPA] = useState<number | ''>('');
  const [failedTermCreditsYes, setFailedTermCreditsYes] = useState<number | ''>(0);
  const [retakenCoursesYes, setRetakenCoursesYes] = useState<RetakenCourse[]>([]);
  
  const [gpaScaleNo, setGpaScaleNo] = useState<number | ''>('');
  const [coursesNo, setCoursesNo] = useState<CourseData[]>([]);

  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [finalCGPA, setFinalCGPA] = useState<string>('0.00');
  const [finalPassedCreditsDisplay, setFinalPassedCreditsDisplay] = useState<number>(0);
  const [calculatedTermGPANo, setCalculatedTermGPANo] = useState<string>('');

  // ---------------- Validations (General & Yes) ----------------
  const isTermGPAInvalid = termGPA !== '' && (Number(termGPA) < 0 || Number(termGPA) > 5);
  const isTermCreditsInvalid = termCredits !== '' && (Number(termCredits) < 12 || Number(termCredits) > 21 || !Number.isInteger(Number(termCredits)));
  
  let minCoursesAllowed = 4;
  if (termCredits !== '' && !isTermCreditsInvalid) {
    const ch = Number(termCredits);
    if (ch === 20 || ch === 21) minCoursesAllowed = 6;
    else if (ch >= 17 && ch <= 19) minCoursesAllowed = 5;
  }
  const isTermCoursesInvalid = termCoursesCount !== '' && (Number(termCoursesCount) < minCoursesAllowed || Number(termCoursesCount) > 10 || !Number.isInteger(Number(termCoursesCount)));
  
  const isPrevCGPAInvalid = prevCGPA !== '' && (Number(prevCGPA) < 0 || Number(prevCGPA) > 5);
  const isPrevPassedCreditsInvalid = prevPassedCredits !== '' && (Number(prevPassedCredits) <= 0 || !Number.isInteger(Number(prevPassedCredits)));
  
  const isFailedTermCreditsYesInvalid = failedTermCreditsYes !== '' && (Number(failedTermCreditsYes) < 0 || Number(failedTermCreditsYes) > Number(termCredits) || !Number.isInteger(Number(failedTermCreditsYes)));

  // ---------------- Validations (No) ----------------
  useEffect(() => {
    if (hasCalculatedTerm === false && termCoursesCount !== '' && !isTermCoursesInvalid) {
      const count = Number(termCoursesCount);
      setCoursesNo((prev) => {
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
  }, [termCoursesCount, isTermCoursesInvalid, hasCalculatedTerm]);

  const handleCourseChangeNo = (id: number, field: keyof CourseData, value: string | number | boolean) => {
    setCoursesNo(coursesNo.map(course => course.id === id ? { ...course, [field]: value } : course));
    setShowResult(false);
  };

  const getDuplicateNamesNo = () => {
    const names = coursesNo.map(c => c.name.trim()).filter(n => n !== '');
    return names.filter((item, index) => names.indexOf(item) !== index);
  };
  const duplicateNamesNo = getDuplicateNamesNo();

  const totalEnteredCreditsNo = coursesNo.reduce((sum, course) => sum + (course.credits === '' ? 0 : Number(course.credits)), 0);
  const count5CreditsNo = coursesNo.filter(c => c.credits === 5).length;
  const count4CreditsNo = coursesNo.filter(c => c.credits === 4).length;
  
  const allCreditsFilledNo = coursesNo.length > 0 && coursesNo.every(c => c.credits !== '');
  const isTotalCreditsExceededNo = termCredits !== '' && totalEnteredCreditsNo > Number(termCredits);
  const isTotalCreditsShortNo = termCredits !== '' && allCreditsFilledNo && totalEnteredCreditsNo < Number(termCredits);
  const isTotalCreditsExactNo = termCredits !== '' && allCreditsFilledNo && totalEnteredCreditsNo === Number(termCredits);
  
  const hasEmptyFieldsNo = coursesNo.length > 0 && coursesNo.some(c => c.name.trim() === '' || c.credits === '' || c.score === '');
  const hasAnyErrorsNo = coursesNo.some(c => {
    const isNameDup = c.name.trim() !== '' && duplicateNamesNo.includes(c.name.trim());
    const isScoreInvalid = c.score !== '' && (Number(c.score) < 0 || Number(c.score) > 100 || !Number.isInteger(Number(c.score)));
    const isCreditsInvalid = c.credits !== '' && (Number(c.credits) < 1 || Number(c.credits) > 5 || !Number.isInteger(Number(c.credits)));
    return isNameDup || isScoreInvalid || isCreditsInvalid;
  });

  // ---------------- Calculation Checkers ----------------
  const canCalculateYes = 
    termGPA !== '' && !isTermGPAInvalid &&
    termCredits !== '' && !isTermCreditsInvalid &&
    termCoursesCount !== '' && !isTermCoursesInvalid &&
    failedTermCreditsYes !== '' && !isFailedTermCreditsYesInvalid &&
    prevCGPA !== '' && !isPrevCGPAInvalid &&
    prevPassedCredits !== '' && !isPrevPassedCreditsInvalid;

  const canCalculateNo = 
    gpaScaleNo !== '' &&
    prevCGPA !== '' && !isPrevCGPAInvalid &&
    prevPassedCredits !== '' && !isPrevPassedCreditsInvalid &&
    termCredits !== '' && !isTermCreditsInvalid &&
    termCoursesCount !== '' && !isTermCoursesInvalid &&
    isTotalCreditsExactNo && !hasEmptyFieldsNo && !hasAnyErrorsNo && 
    count5CreditsNo <= 1 && count4CreditsNo <= 2 && coursesNo.length > 0;

  // ---------------- Handlers ----------------
  const handleHasCalculatedChange = (value: boolean) => {
    setHasCalculatedTerm(value);
    setShowResult(false);
    
    setPrevCGPA(''); setPrevPassedCredits(''); setTermCredits(''); setTermCoursesCount(''); setTermGPA(''); setFailedTermCreditsYes(0);
    
    if (value && sharedData.termGPA !== '') {
      setTermGPA(Number(sharedData.termGPA));
      setTermCredits(Number(sharedData.termCredits));
      setTermCoursesCount(Number(sharedData.termCourses));
      setRetakenCoursesYes(sharedData.retakenCourses || []);
      // سحب ساعات الرسوب تلقائياً من صفحة الترم
      setFailedTermCreditsYes(sharedData.failedTermCredits !== '' ? Number(sharedData.failedTermCredits) : 0);
    }
  };

  const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setShowResult(false);
  };

  // ---------------- Core Logic Execution ----------------
  const handleCalculate = () => {
    setIsCalculating(true);
    setShowResult(false);

    let finalTermGPA = 0;
    let sumRetakenCredits = 0;
    let totalPassedCreditsFinal = 0;

    if (hasCalculatedTerm === false) {
      let totalPoints = 0;
      let totalDenominatorCredits = 0;
      let failedCreditsNo = 0;

      coursesNo.forEach(course => {
        const credits = Number(course.credits);
        const courseResult = calculateCourseGPA(course.score, gpaScaleNo);
        if (courseResult) {
          const courseGPA = Number(courseResult.gpa);
          if (course.hasFailedBefore) sumRetakenCredits += credits;
          if (courseResult.grade === 'F') failedCreditsNo += credits;
          
          totalPoints += (courseGPA * credits);
          totalDenominatorCredits += course.hasFailedBefore ? (credits * 2) : credits;
        }
      });
      finalTermGPA = totalPoints / totalDenominatorCredits;
      setCalculatedTermGPANo(finalTermGPA.toFixed(2));
      
      // حساب المجتاز لمسار "لا"
      totalPassedCreditsFinal = Number(prevPassedCredits) + Number(termCredits) - failedCreditsNo;
    } else {
      finalTermGPA = Number(termGPA);
      sumRetakenCredits = retakenCoursesYes.reduce((sum, course) => sum + course.credits, 0);
      
      // حساب المجتاز لمسار "نعم"
      totalPassedCreditsFinal = Number(prevPassedCredits) + Number(termCredits) - Number(failedTermCreditsYes);
    }

    // المعادلة التراكمية
    const A = Number(prevCGPA) * Number(prevPassedCredits);
    const B = Number(termCredits) + sumRetakenCredits;
    const C = B * finalTermGPA;
    const D = A + C;
    const E = Number(termCredits) + Number(prevPassedCredits);
    
    const calculatedCGPA = D / E;

    setTimeout(() => {
      setFinalCGPA(calculatedCGPA.toFixed(2));
      setFinalPassedCreditsDisplay(totalPassedCreditsFinal);
      setIsCalculating(false);
      setShowResult(true);
    }, 1500);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <GraduationCap size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">إعدادات المعدل التراكمي (CGPA)</h2>
      </div>

      <div className="space-y-8">
        <div className="animate-in fade-in duration-500">
          <label className="block text-sm font-bold text-gray-700 mb-4">1. هل قمت بحساب معدل الترم الحالي؟</label>
          
          {sharedData.termGPA !== '' && hasCalculatedTerm === null && (
            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <Sparkles className="text-indigo-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-indigo-800 font-bold text-sm">لقد قمت بحساب معدل الترم مسبقاً!</p>
                <p className="text-indigo-600 text-sm mt-1">
                  معدلك هو <span className="font-black text-lg bg-indigo-100 px-2 py-0.5 rounded">{sharedData.termGPA}</span> لـ {sharedData.termCredits} ساعة. 
                  {Number(sharedData.failedTermCredits) > 0 && <span className="text-red-500 font-bold mx-1">(ولديك {sharedData.failedTermCredits} ساعات رسوب).</span>}
                  اختر "نعم" ليتم ملء البيانات تلقائياً.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => handleHasCalculatedChange(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border-2 ${
                hasCalculatedTerm === true ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-200'
              }`}
            >
              نعم، حسبته
            </button>
            <button
              onClick={() => handleHasCalculatedChange(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border-2 ${
                hasCalculatedTerm === false ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
              }`}
            >
              لا، لم أحسبه
            </button>
          </div>
        </div>

        {/* ----------------- UI مسار "نعم" ----------------- */}
        {hasCalculatedTerm === true && (
          <div className="space-y-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">معدل الترم الحالي (0 - 5)</label>
                <input type="number" step="0.01" placeholder="مثال: 3.45" value={termGPA} onChange={(e) => handleChange(setTermGPA, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`w-full p-3 border rounded-lg outline-none font-medium ${isTermGPAInvalid ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-emerald-500'}`} />
                {isTermGPAInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> المعدل يجب أن يكون بين 0 و 5.</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">إجمالي الساعات المسجلة للترم</label>
                <input type="number" step="1" placeholder="مثال: 18 (12 - 21)" value={termCredits} onChange={(e) => handleChange(setTermCredits, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`w-full p-3 border rounded-lg outline-none font-medium ${isTermCreditsInvalid ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-emerald-500'}`} />
                {isTermCreditsInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> الساعات يجب أن تكون رقم صحيح بين 12 و 21.</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  عدد المواد المسجلة للترم <span className="text-emerald-600 text-xs">(الحد الأدنى {minCoursesAllowed})</span>
                </label>
                <input type="number" step="1" placeholder={`الحد الأدنى ${minCoursesAllowed} والأقصى 10`} value={termCoursesCount} onChange={(e) => handleChange(setTermCoursesCount, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`w-full p-3 border rounded-lg outline-none font-medium ${isTermCoursesInvalid ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-emerald-500'}`} />
                {isTermCoursesInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> عدد المواد يجب أن يكون رقم صحيح بين {minCoursesAllowed} و 10.</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ساعات رسوب الترم الحالي (إن وجدت)</label>
                <input type="number" step="1" placeholder="مثال: 3" value={failedTermCreditsYes} onChange={(e) => handleChange(setFailedTermCreditsYes, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`w-full p-3 border rounded-lg outline-none font-medium ${isFailedTermCreditsYesInvalid ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-emerald-500'}`} />
                {isFailedTermCreditsYesInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> تأكد من صحة ساعات الرسوب.</p>}
              </div>
            </div>

            {retakenCoursesYes.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="text-amber-500" size={18} />
                  <h3 className="font-bold text-amber-800">مواد معادة تم سحبها من الترم:</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {retakenCoursesYes.map((fc, idx) => (
                    <span key={idx} className="bg-amber-200 text-amber-900 text-sm px-3 py-1 rounded-full font-semibold">{fc.name || 'مادة'} ({fc.credits} ساعات)</span>
                  ))}
                </div>
              </div>
            )}

            {termGPA !== '' && termCredits !== '' && !isTermGPAInvalid && !isTermCreditsInvalid && (
              <div className="border-t border-gray-100 pt-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المعدل التراكمي السابق</label>
                  <input type="number" step="0.01" placeholder="مثال: 3.10" value={prevCGPA} onChange={(e) => handleChange(setPrevCGPA, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`w-full p-3 border rounded-lg outline-none font-medium ${isPrevCGPAInvalid ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`} />
                  {isPrevCGPAInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> المعدل يجب أن يكون بين 0 و 5.</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الساعات المجتازة السابقة</label>
                  <input type="number" step="1" placeholder="مثال: 65" value={prevPassedCredits} onChange={(e) => handleChange(setPrevPassedCredits, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`w-full p-3 border rounded-lg outline-none font-medium ${isPrevPassedCreditsInvalid ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`} />
                  {isPrevPassedCreditsInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> الساعات يجب أن تكون رقم صحيح أكبر من الصفر.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- UI مسار "لا" ----------------- */}
        {hasCalculatedTerm === false && (
          <div className="space-y-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
            
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-5">
              <h3 className="font-bold text-blue-800 flex items-center gap-2"><Info size={20}/> بيانات النظام والفصول السابقة</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">نظام الـ GPA</label>
                  <select value={gpaScaleNo} onChange={(e) => handleChange(setGpaScaleNo, Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg outline-none">
                    <option value="" disabled>-- اختر النظام --</option>
                    <option value={4}>من 4.0</option><option value={5}>من 5.0</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المعدل التراكمي السابق</label>
                  <input type="number" step="0.01" value={prevCGPA} onChange={(e) => handleChange(setPrevCGPA, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} placeholder="مثال: 3.10" className={`w-full p-3 border rounded-lg outline-none ${isPrevCGPAInvalid ? 'border-red-500' : 'border-gray-300'}`} />
                  {isPrevCGPAInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> المعدل يجب أن يكون بين 0 و 5.</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الساعات التراكمية السابقة</label>
                  <input type="number" step="1" value={prevPassedCredits} onChange={(e) => handleChange(setPrevPassedCredits, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} placeholder="مثال: 65" className={`w-full p-3 border rounded-lg outline-none ${isPrevPassedCreditsInvalid ? 'border-red-500' : 'border-gray-300'}`} />
                  {isPrevPassedCreditsInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> الساعات يجب أن تكون رقم صحيح أكبر من الصفر.</p>}
                </div>
              </div>
            </div>

            {gpaScaleNo !== '' && prevCGPA !== '' && prevPassedCredits !== '' && !isPrevCGPAInvalid && !isPrevPassedCreditsInvalid && (
              <div className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-5 animate-in fade-in">
                <h3 className="font-bold text-indigo-800 flex items-center gap-2"><BookOpen size={20}/> تفاصيل الترم الحالي للدمج التراكمي</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">إجمالي الساعات المسجلة (12-21)</label>
                    <input type="number" step="1" value={termCredits} onChange={(e) => handleChange(setTermCredits, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`w-full p-3 border rounded-lg outline-none font-medium ${isTermCreditsInvalid ? 'border-red-500 ring-2 ring-red-200 text-red-600 bg-red-50' : termCredits !== '' ? 'border-indigo-500 ring-2 ring-indigo-200 text-gray-900' : 'border-gray-300 placeholder-gray-400 italic'}`} />
                    {isTermCreditsInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-semibold"><AlertCircle size={16} /> عدد الساعات يجب أن يكون بين 12 و 21.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">عدد المواد (الحد الأدنى {minCoursesAllowed})</label>
                    <input type="number" step="1" value={termCoursesCount} onChange={(e) => handleChange(setTermCoursesCount, e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`w-full p-3 border rounded-lg outline-none font-medium ${isTermCoursesInvalid ? 'border-red-500 ring-2 ring-red-200 text-red-600 bg-red-50' : termCoursesCount !== '' ? 'border-indigo-500 ring-2 ring-indigo-200 text-gray-900' : 'border-gray-300 placeholder-gray-400 italic'}`} />
                    {isTermCoursesInvalid && <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-semibold"><AlertCircle size={16} /> عدد المواد يجب أن يكون بين {minCoursesAllowed} و 10.</p>}
                  </div>
                </div>

                {termCredits !== '' && termCoursesCount !== '' && !isTermCreditsInvalid && !isTermCoursesInvalid && (
                  <div className="pt-4 mt-4 border-t border-indigo-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                      <h4 className="font-bold text-gray-800">درجات مواد الترم الحالي</h4>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                        isTotalCreditsExceededNo || isTotalCreditsShortNo ? 'bg-red-100 text-red-700 border border-red-200' 
                        : isTotalCreditsExactNo ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {isTotalCreditsExactNo ? <CheckCircle2 size={18} /> : <Info size={18} />}
                        <span>العداد: {totalEnteredCreditsNo} / {termCredits}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      {coursesNo.map((course, index) => {
                        const isNameDup = course.name.trim() !== '' && duplicateNamesNo.includes(course.name.trim());
                        const isScoreInvalid = course.score !== '' && (Number(course.score) < 0 || Number(course.score) > 100 || !Number.isInteger(Number(course.score)));
                        const isCreditsInvalid = course.credits !== '' && (Number(course.credits) < 1 || Number(course.credits) > 5 || !Number.isInteger(Number(course.credits)));
                        const hasRowError = isNameDup || isScoreInvalid || isCreditsInvalid;
                        
                        const liveData = calculateCourseGPA(course.score, gpaScaleNo);

                        return (
                          <div key={course.id} className={`flex flex-col bg-gray-50 p-4 rounded-xl border transition-colors ${
                            hasRowError ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300'
                          }`}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <input type="text" placeholder={`اسم المادة ${arabicOrdinals[index]}`} value={course.name} onChange={(e) => handleCourseChangeNo(course.id, 'name', e.target.value)} className={`col-span-1 md:col-span-2 p-2.5 bg-white border rounded-lg focus:ring-2 outline-none placeholder-gray-400 font-medium ${isNameDup ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} />
                              <input type="number" step="1" placeholder="الساعات (1-5)" value={course.credits} onChange={(e) => handleCourseChangeNo(course.id, 'credits', e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className="p-2.5 bg-white border border-gray-300 focus:ring-indigo-500 rounded-lg focus:ring-2 outline-none placeholder-gray-400 font-medium" />
                              <input type="number" step="1" placeholder="الدرجة (0-100)" value={course.score} onChange={(e) => handleCourseChangeNo(course.id, 'score', e.target.value === '' ? '' : Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className="p-2.5 bg-white border border-gray-300 focus:ring-indigo-500 rounded-lg focus:ring-2 outline-none placeholder-gray-400 font-medium" />
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-3 px-1 gap-2">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 w-fit cursor-pointer select-none">
                                <input type="checkbox" checked={course.hasFailedBefore} onChange={(e) => handleCourseChangeNo(course.id, 'hasFailedBefore', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                                هل رسبت في هذه المادة سابقاً؟ (مادة معادة)
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
                      {count5CreditsNo > 1 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                          <AlertCircle size={18} /> لا يمكن تسجيل أكثر من مادة واحدة بـ 5 ساعات معتمدة.
                        </div>
                      )}
                      {count4CreditsNo > 2 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                          <AlertCircle size={18} /> لا يمكن تسجيل أكثر من مادتين بـ 4 ساعات معتمدة.
                        </div>
                      )}
                      {isTotalCreditsExceededNo && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                          <AlertCircle size={18} /> مجموع الساعات الموزعة ({totalEnteredCreditsNo}) يتجاوز الساعات المسجلة ({termCredits}).
                        </div>
                      )}
                      {isTotalCreditsShortNo && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                          <AlertCircle size={18} /> مجموع الساعات الموزعة ({totalEnteredCreditsNo}) أقل من الساعات المسجلة ({termCredits}). يرجى مراجعة الساعات لتتطابق تماماً.
                        </div>
                      )}
                      {hasEmptyFieldsNo && !isTotalCreditsExceededNo && !isTotalCreditsShortNo && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm font-semibold flex items-center gap-2">
                          <AlertCircle size={18} /> يرجى ملء جميع الخانات لتتمكن من حساب المعدل.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* زر الحساب المشترك */}
        {hasCalculatedTerm !== null && (
          <button
            onClick={handleCalculate}
            disabled={isCalculating || (hasCalculatedTerm ? !canCalculateYes : !canCalculateNo)}
            className={`w-full mt-8 font-bold py-4 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 
              ${(hasCalculatedTerm ? canCalculateYes : canCalculateNo) ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {isCalculating ? <><Loader2 className="animate-spin" size={24} /> جاري معالجة البيانات...</> : <><Calculator size={24} /> احسب المعدل التراكمي (CGPA)</>}
          </button>
        )}

        {/* النتيجة النهائية */}
        {showResult && (
          <div className="mt-8 p-6 md:p-10 bg-gradient-to-br from-indigo-50 to-emerald-50 border-2 border-indigo-100 rounded-2xl text-center animate-in zoom-in duration-500 shadow-lg relative">
            
            {hasCalculatedTerm === false && calculatedTermGPANo !== '' && (
              <div className="absolute top-4 left-4 bg-white px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm animate-in fade-in">
                <span className="text-gray-600 font-bold text-xs">معدل الترم: <span className="text-indigo-600 text-sm">{calculatedTermGPANo}</span></span>
              </div>
            )}

            <p className="text-gray-600 font-bold mb-3 text-lg mt-4">المعدل التراكمي النهائي (CGPA) هو:</p>
            <h3 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500 tracking-tight drop-shadow-sm">{finalCGPA}</h3>
            
            <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4 text-sm font-bold text-gray-500">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border shadow-sm"><CheckCircle2 className="text-emerald-500" size={18} />إجمالي الساعات المجتازة: {finalPassedCreditsDisplay}</span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border shadow-sm"><Info className="text-blue-500" size={18} />نظام {hasCalculatedTerm ? sharedData.scale : gpaScaleNo}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CumulativeGPA;