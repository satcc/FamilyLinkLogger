import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { DayDetailView } from './components/DayDetailView';
import { MonthlyData } from './types';
import { auth, onAuthStateChanged, User, isFirebaseConfigured, loginWithGoogle } from './firebase';
import { Lock, LogIn } from 'lucide-react';

export const App: React.FC = () => {
  // 現在の日付をもとにデフォルト月を設定
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [currentMonth, setCurrentMonth] = useState<string>(defaultMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [hasInitializedMember, setHasInitializedMember] = useState<boolean>(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isFirebaseConfigured);

  // 初回データ読み込み時に最初のメンバーをデフォルト選択
  useEffect(() => {
    if (monthlyData?.members && !hasInitializedMember) {
      const memberKeys = Object.keys(monthlyData.members);
      if (memberKeys.length > 0) {
        setSelectedMemberId(memberKeys[0]);
        setHasInitializedMember(true);
      }
    }
  }, [monthlyData, hasInitializedMember]);

  // Firebase Auth リッスン
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 月別 JSON データのフェッチ
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const dataUrl = `/data/${currentMonth}.json`;
    fetch(dataUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Data not found: ${res.status}`);
        }
        return res.json();
      })
      .then((data: MonthlyData) => {
        if (isMounted) {
          setMonthlyData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn(`Failed to load ${dataUrl}:`, err);
        if (isMounted) {
          setMonthlyData(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentMonth]);

  // URLハッシュ連動（ブラウザバック・進む対応）
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (/^\d{4}-\d{2}-\d{2}$/.test(hash)) {
        setSelectedDate(hash);
        const yMonth = hash.substring(0, 7);
        setCurrentMonth(yMonth);
      } else {
        setSelectedDate(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // 初回実行

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectDate = (dateStr: string) => {
    window.location.hash = dateStr;
    setSelectedDate(dateStr);
    const yMonth = dateStr.substring(0, 7);
    if (yMonth !== currentMonth) {
      setCurrentMonth(yMonth);
    }
  };

  const handleBackToMonth = (yearMonth: string) => {
    window.location.hash = '';
    setSelectedDate(null);
    setCurrentMonth(yearMonth);
  };

  const handleNavigateHome = () => {
    window.location.hash = '';
    setSelectedDate(null);
  };

  // Auth で保護されている場合の未ログイン画面
  if (isFirebaseConfigured && !authLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">FamilyLink Logger</h2>
          <p className="text-slate-500 text-sm mt-2 mb-8 leading-relaxed">
            このダッシュボードは家族限定で保護されています。<br />
            Google アカウントでログインして続行してください。
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md hover:shadow-indigo-200"
          >
            <LogIn className="w-4 h-4" />
            <span>Google アカウントでログイン</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar user={user} onNavigateHome={handleNavigateHome} />

      {selectedDate ? (
        <DayDetailView
          dateStr={selectedDate}
          monthlyData={monthlyData}
          selectedMemberId={selectedMemberId}
          onSelectMember={setSelectedMemberId}
          onSelectDate={handleSelectDate}
          onBackToMonth={handleBackToMonth}
        />
      ) : (
        <CalendarView
          currentMonth={currentMonth}
          data={monthlyData}
          loading={loading}
          selectedMemberId={selectedMemberId}
          onSelectMember={setSelectedMemberId}
          onSelectMonth={setCurrentMonth}
          onSelectDate={handleSelectDate}
        />
      )}
    </div>
  );
};
