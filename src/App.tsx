import { useState } from 'react';
import TermGPA from './components/TermGPA';
import CumulativeGPA from './components/CumulativeGPA';
import { Calculator } from 'lucide-react';

export type CalculatorMode = 'term' | 'cumulative';

export interface RetakenCourse {
  name: string;
  credits: number;
}

// تعريف نوع البيانات المشتركة بين الصفحتين
export interface SharedData {
  scale: number | '';
  termGPA: string | '';
  termCredits: number | '';
  termPoints: number | ''; 
  termCourses: number | ''; // السطر الجديد أهه
  retakenCourses: RetakenCourse[]; // والسطر ده
  failedTermCredits: number | ''; // <--- السطر الجديد
}

function App() {
  const [mode, setMode] = useState<CalculatorMode>('term');
  
  // الـ State اللي هتحتفظ بالبيانات لما اليوزر يبدل بين الصفحات
  const [sharedData, setSharedData] = useState<SharedData>({
    scale: '',
    termGPA: '',
    termCredits: '',
    termPoints: '',
    termCourses: '', // السطر الجديد أهه
    retakenCourses: [], // والسطر ده
    failedTermCredits: '' // <--- والسطر ده
  });

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 font-sans dir-rtl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-full mb-4 shadow-md text-white">
          <Calculator size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          GPA Calculator
        </h1>
        <p className="text-gray-500 mt-2 text-lg">احسب معدلك الفصلي والتراكمي بسهولة</p>
      </div>

      <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 mb-8 flex gap-2 w-full max-w-md">
        <button
          onClick={() => setMode('term')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
            mode === 'term' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          معدل الترم
        </button>
        <button
          onClick={() => setMode('cumulative')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
            mode === 'cumulative' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          المعدل التراكمي
        </button>
      </div>

      <div className="w-full max-w-2xl">
        {mode === 'term' ? (
          <TermGPA onCalculate={(data) => setSharedData(data)} />
        ) : (
          <CumulativeGPA sharedData={sharedData} />
        )}
      </div>
    </div>
  );
}

export default App;