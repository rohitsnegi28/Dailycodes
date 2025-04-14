
import { useState, useEffect } from 'react';

export default function DynamicTextTimer() {
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [locale, setLocale] = useState('en-US');
  const [dynamicText, setDynamicText] = useState('Time elapsed: {minutes} minutes and {seconds} seconds');
  
  // Locale-specific text templates
  const localeTexts = {
    'en-US': 'Time elapsed: {minutes} minutes and {seconds} seconds',
    'es-ES': 'Tiempo transcurrido: {minutes} minutos y {seconds} segundos',
    'fr-FR': 'Temps écoulé: {minutes} minutes et {seconds} secondes',
    'de-DE': 'Verstrichene Zeit: {minutes} Minuten und {seconds} Sekunden',
    'ja-JP': '経過時間: {minutes}分 {seconds}秒',
    'zh-CN': '已用时间: {minutes}分钟 {seconds}秒',
    'ru-RU': 'Прошло времени: {minutes} минут и {seconds} секунд',
    'ar-SA': 'الوقت المنقضي: {minutes} دقائق و {seconds} ثواني'
  };
  
  // Update timer every second when running
  useEffect(() => {
    let interval = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => {
          if (prevSeconds === 59) {
            setMinutes(prevMinutes => prevMinutes + 1);
            return 0;
          }
          return prevSeconds + 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);
  
  // Update text template when locale changes
  useEffect(() => {
    if (localeTexts[locale]) {
      setDynamicText(localeTexts[locale]);
    }
  }, [locale]);
  
  // Generate the dynamic string with timer values
  const getFormattedText = () => {
    return dynamicText
      .replace('{minutes}', minutes.toString())
      .replace('{seconds}', seconds < 10 ? `0${seconds}` : seconds.toString());
  };

  // Handle text template change
  const handleTextChange = (e) => {
    setDynamicText(e.target.value);
  };

  // Reset timer
  const resetTimer = () => {
    setSeconds(0);
    setMinutes(0);
  };

  // Toggle timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Handle locale change
  const handleLocaleChange = (e) => {
    setLocale(e.target.value);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Dynamic Text Timer</h2>
      
      <div className="text-3xl font-mono mb-6 text-center">
        {getFormattedText()}
      </div>
      
      <div className="flex gap-3 mb-6">
        <button 
          onClick={toggleTimer}
          className={`px-4 py-2 rounded-md font-medium ${
            isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
          } text-white transition-colors`}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        
        <button 
          onClick={resetTimer}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
        >
          Reset
        </button>
      </div>
      
      <div className="w-full mb-4">
        <label htmlFor="locale-select" className="block mb-2 font-medium">
          Language/Locale:
        </label>
        <select
          id="locale-select"
          value={locale}
          onChange={handleLocaleChange}
          className="w-full p-3 border rounded-md bg-white"
        >
          <option value="en-US">English (US)</option>
          <option value="es-ES">Spanish (Spain)</option>
          <option value="fr-FR">French (France)</option>
          <option value="de-DE">German (Germany)</option>
          <option value="ja-JP">Japanese (Japan)</option>
          <option value="zh-CN">Chinese (China)</option>
          <option value="ru-RU">Russian (Russia)</option>
          <option value="ar-SA">Arabic (Saudi Arabia)</option>
        </select>
      </div>
      
      <div className="w-full">
        <label className="block mb-2 font-medium">
          Text Template (use {'{minutes}'} and {'{seconds}'} placeholders):
        </label>
        <textarea
          value={dynamicText}
          onChange={handleTextChange}
          className="w-full p-3 border rounded-md h-24"
          dir={locale === 'ar-SA' ? 'rtl' : 'ltr'}
        />
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Current locale: <strong>{locale}</strong></p>
        <p>The timer text will automatically update when you change the language.</p>
      </div>
    </div>
  );
}
